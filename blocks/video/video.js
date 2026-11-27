function getYouTubeId(url) {
  if (!url || !['https:', 'http:'].includes(url.protocol)) return null;

  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  const [, type, pathId] = url.pathname.split('/');
  let id;
  if (host === 'youtu.be') id = type;
  if (host === 'youtube.com' && type === 'watch') id = url.searchParams.get('v');
  if (['youtube.com', 'youtube-nocookie.com'].includes(host) && ['embed', 'shorts', 'live'].includes(type)) id = pathId;
  return /^[\w-]{11}$/.test(id || '') ? id : null;
}

function decorateYouTube(player, id, poster) {
  player.classList.add('video-youtube');

  const preview = poster || document.createElement('img');
  if (!poster) {
    preview.alt = '';
    preview.loading = 'lazy';
    preview.addEventListener('error', () => {
      preview.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }, { once: true });
    preview.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  }
  player.append(preview.closest('picture') || preview);

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'video-play-button';
  play.setAttribute('aria-label', 'Play featured video');
  play.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Featured video on YouTube';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`;
    player.replaceChildren(iframe);
    iframe.focus();
  }, { once: true });
  player.append(play);
}

export default function decorate(block) {
  const media = block.querySelector('a[href]');
  const poster = block.querySelector('img');
  const url = media ? new URL(media.href) : null;
  const youtubeId = getYouTubeId(url);
  const player = document.createElement('div');
  player.className = 'video-player';

  if (youtubeId) {
    decorateYouTube(player, youtubeId, poster);
  } else if (url && /\.(mp4|webm|ogg)$/i.test(url.pathname)) {
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
