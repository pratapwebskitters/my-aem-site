export default function decorate(block) {
  const media = block.querySelector('a[href]');
  const poster = block.querySelector('img');
  const player = document.createElement('div');
  player.className = 'video-player';

  if (media && /\.(mp4|webm|ogg)$/i.test(new URL(media.href).pathname)) {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.src = media.href;
    if (poster) video.poster = poster.src;
    player.append(video);
  } else {
    if (poster) player.append(poster.closest('picture') || poster);
    if (media) {
      media.className = 'video-play-link';
      player.append(media);
    } else {
      const message = document.createElement('p');
      message.textContent = 'Video coming soon';
      player.append(message);
    }
  }
  block.replaceChildren(player);
}
