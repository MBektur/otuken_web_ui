"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent, MouseEvent, KeyboardEvent } from "react";
import { cardStops, nearestStop } from "@/lib/carousel";

type Gesture = { id: number; x: number; y: number; lastX: number; lastTime: number; velocity: number; position: number; index: number; moved: boolean };

export function useCardCarousel(count: number, interval: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isRtl, setIsRtl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [windowPaused, setWindowPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const targetIndexRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const gestureRef = useRef<Gesture | null>(null);
  const blockClickRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoplayDirectionRef = useRef<"next" | "prev">("next");

  const metrics = useCallback(() => {
    const el = trackRef.current;
    if (!el) return null;
    const rtl = getComputedStyle(el).direction === "rtl";
    const cards = Array.from(el.children) as HTMLElement[];
    const first = cards[0]?.getBoundingClientRect();
    const offsets = cards.map(card => {
      const rect = card.getBoundingClientRect();
      return first ? Math.abs((rtl ? rect.right : rect.left) - (rtl ? first.right : first.left)) : 0;
    });
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    return { el, rtl, stops: cardStops(offsets, max), position: Math.max(0, Math.min(max, rtl ? -el.scrollLeft : el.scrollLeft)) };
  }, []);

  const updatePagination = useCallback(() => {
    const data = metrics();
    if (!data) return;
    const { stops, position } = data;
    const index = nearestStop(stops, position);
    activeIndexRef.current = index;
    if (targetIndexRef.current !== null && Math.abs(position - stops[targetIndexRef.current]) < 1) targetIndexRef.current = null;
    const target = targetIndexRef.current ?? index;
    setCurrentPage(index + 1);
    setTotalPages(stops.length);
    setCanPrev(target > 0);
    setCanNext(target < stops.length - 1);
  }, [metrics]);

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const data = metrics();
    if (!data) return;
    const target = Math.max(0, Math.min(data.stops.length - 1, index));
    targetIndexRef.current = target;
    data.el.scrollTo({ left: data.stops[target] * (data.rtl ? -1 : 1), behavior: reducedMotion ? "instant" : behavior });
    updatePagination();
  }, [metrics, reducedMotion, updatePagination]);

  const scrollOneCard = useCallback((direction: "next" | "prev") => {
    const data = metrics();
    if (!data) return;
    const index = targetIndexRef.current ?? nearestStop(data.stops, data.position);
    goTo(index + (direction === "next" ? 1 : -1));
  }, [goTo, metrics]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let lastRtl = getComputedStyle(el).direction === "rtl";
    const refresh = () => {
      const data = metrics();
      if (!data) return;
      setIsRtl(data.rtl);
      lastRtl = data.rtl;
      goTo(activeIndexRef.current, "instant");
    };
    refresh();
    const resize = new ResizeObserver(refresh);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    const direction = new MutationObserver(() => {
      if (metrics()?.rtl !== lastRtl) refresh();
    });
    for (let parent: HTMLElement | null = el; parent; parent = parent.parentElement) {
      direction.observe(parent, { attributes: true, attributeFilter: ["dir", "class", "style"] });
    }
    el.addEventListener("scroll", updatePagination, { passive: true });
    return () => { resize.disconnect(); direction.disconnect(); el.removeEventListener("scroll", updatePagination); };
  }, [count, goTo, metrics, updatePagination]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(motion.matches);
    const onVisibility = () => setWindowPaused(document.hidden);
    const onBlur = () => setWindowPaused(true);
    onMotion(); onVisibility();
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("blur", onBlur);
      clearTimeout(clickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (hovered || focused || windowPaused || reducedMotion || isDragging || count <= 1) return;
    const timer = setInterval(() => {
      const data = metrics();
      if (!data || gestureRef.current || data.stops.length <= 1) return;
      const index = targetIndexRef.current ?? nearestStop(data.stops, data.position);
      if (index === data.stops.length - 1) autoplayDirectionRef.current = "prev";
      else if (index === 0) autoplayDirectionRef.current = "next";
      scrollOneCard(autoplayDirectionRef.current);
    }, interval);
    return () => clearInterval(timer);
  }, [hovered, focused, windowPaused, reducedMotion, isDragging, count, interval, metrics, scrollOneCard]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const data = metrics();
    if (!data) return;
    const index = targetIndexRef.current ?? nearestStop(data.stops, data.position);
    goTo(index, "instant");
    gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastTime: performance.now(), velocity: 0, position: data.stops[index], index, moved: false };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const data = metrics();
    if (!gesture || gesture.id !== event.pointerId || !data) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.moved) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) { gestureRef.current = null; return; }
      if (Math.abs(dx) <= 5) return;
      gesture.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      data.el.classList.add("is-dragging");
      setIsDragging(true);
    }
    const now = performance.now();
    gesture.velocity = (event.clientX - gesture.lastX) / Math.max(1, now - gesture.lastTime);
    gesture.lastX = event.clientX; gesture.lastTime = now;
    const position = gesture.position + (data.rtl ? dx : -dx);
    const min = data.stops[Math.max(0, gesture.index - 1)];
    const max = data.stops[Math.min(data.stops.length - 1, gesture.index + 1)];
    data.el.scrollTo({ left: Math.max(min, Math.min(max, position)) * (data.rtl ? -1 : 1), behavior: "instant" });
    event.preventDefault();
  }

  function finishGesture(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const gesture = gestureRef.current;
    const data = metrics();
    if (!gesture || gesture.id !== event.pointerId || !data) return;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (gesture.moved) {
      blockClickRef.current = true;
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => { blockClickRef.current = false; }, 250);
      const dx = event.clientX - gesture.x;
      const delta = data.rtl ? dx : -dx;
      const flick = performance.now() - gesture.lastTime < 100 && Math.abs(gesture.velocity) > 0.28;
      const step = !cancelled && (Math.abs(delta) > 35 || flick) ? Math.sign(delta) : 0;
      data.el.classList.remove("is-dragging");
      setIsDragging(false);
      // Settle relative to the card where the gesture began, never from a partial drag.
      goTo(gesture.index + step);
    }
  }

  function handleClickCapture(event: MouseEvent) {
    if (blockClickRef.current || gestureRef.current?.moved) { event.preventDefault(); event.stopPropagation(); }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const rtl = metrics()?.rtl;
    scrollOneCard(event.key === "ArrowLeft" ? (rtl ? "next" : "prev") : (rtl ? "prev" : "next"));
  }

  return {
    trackRef, isRtl, isDragging, currentPage, totalPages, canPrev, canNext, autoplayDirectionRef, scrollOneCard, handleClickCapture,
    pauseHandlers: {
      onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event: React.FocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); },
    },
    dragHandlers: {
      onPointerDown, onPointerMove, onPointerUp: (event: PointerEvent<HTMLDivElement>) => finishGesture(event),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finishGesture(event, true),
      onPointerLeave: (event: PointerEvent<HTMLDivElement>) => { if (gestureRef.current && !gestureRef.current.moved) finishGesture(event, true); },
      onKeyDown,
    },
  };
}
