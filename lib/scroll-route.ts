/** Quita el lock de scroll del menú mobile (body position:fixed). */
export function clearBodyScrollLock() {
  const style = document.body.style;
  const htmlStyle = document.documentElement.style;
  style.overflow = "";
  style.position = "";
  style.top = "";
  style.left = "";
  style.right = "";
  style.width = "";
  htmlStyle.overflow = "";
}

export function scrollWindowToTop() {
  const html = document.documentElement;
  const prevBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  clearBodyScrollLock();
  window.scrollTo(0, 0);
  html.scrollTop = 0;
  document.body.scrollTop = 0;
  html.style.scrollBehavior = prevBehavior;
}
