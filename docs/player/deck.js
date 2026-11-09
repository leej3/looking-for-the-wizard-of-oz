const player = new Reveal(document.querySelector('.reveal'), {
  embedded: true, scrollActivationWidth: null, width: 1280, height: 720, margin: 0.015, maxScale: 3,
  controls: false, hash: true, center: false, transition: 'fade',
  plugins: [RevealNotes]
});
const byId = id => document.getElementById(id);
const dialog = document.querySelector('dialog');
function sync() {
  byId('counter').textContent = (player.getIndices().h + 1) + ' / ' + player.getTotalSlides();
  byId('prev').disabled = player.isFirstSlide();
  byId('next').disabled = player.isLastSlide();
}
byId('prev').onclick = () => player.prev();
byId('next').onclick = () => player.next();
byId('present').onclick = () => player.getPlugin('notes').open();
byId('notes').onclick = () => {
  byId('body').innerHTML = player.getCurrentSlide().querySelector('aside.notes').innerHTML;
  dialog.showModal();
};
byId('close').onclick = () => dialog.close();
dialog.addEventListener('keydown', event => event.stopPropagation());
player.on('slidechanged', sync);
player.initialize().then(sync);
