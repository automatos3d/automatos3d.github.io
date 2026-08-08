(() => {
  const setRatio = () => {
    document.querySelectorAll('.sf-viewer').forEach((sf) => {
      sf.style.aspectRatio = `${window.innerWidth} / ${window.innerHeight}`;
    });
  };
  setRatio();
  window.addEventListener('resize', setRatio);
})();
