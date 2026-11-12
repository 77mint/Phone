var phone = document.getElementById('phone');

function fitPhone() {
  if (window.navigator.standalone !== true) {
    phone.style.height = '';
    return;
  }
  var portrait = window.matchMedia('(orientation: portrait)').matches;
  var screenH = portrait
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height);
  phone.style.height = Math.max(window.innerHeight, screenH) + 'px';
}

fitPhone();
window.addEventListener('resize', fitPhone);
window.addEventListener('orientationchange', fitPhone);
window.addEventListener('pageshow', fitPhone);
setTimeout(fitPhone, 300);
setTimeout(fitPhone, 1000);