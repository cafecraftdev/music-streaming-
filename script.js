const tracks = [
  { title: 'Neon Echoes', artist: 'BeatFlow Originals', duration: 228, color: 'sunset', notes: [220,277.2,329.6,440,329.6,277.2], beat: 320 },
  { title: 'Electric Bloom', artist: 'BeatFlow Originals', duration: 196, color: 'violet', notes: [261.6,311.1,392,466.2,392,311.1], beat: 270 },
  { title: 'Night Signal', artist: 'BeatFlow Originals', duration: 214, color: 'blue', notes: [196,246.9,293.7,370,293.7,246.9], beat: 390 },
  { title: 'Afterlight', artist: 'BeatFlow Originals', duration: 242, color: 'pink', notes: [329.6,392,493.9,587.3,493.9,392], beat: 240 },
  { title: 'Solar Drift', artist: 'BeatFlow Originals', duration: 201, color: 'amber', notes: [246.9,293.7,370,493.9,370,293.7], beat: 350 }
];

const playlists = [
  ['Sunset Grooves','Warm and laid-back vibes','sunset',32],
  ['Synthwave Dreams','Retro beats and neon nights','violet',24],
  ['Energy Boost','High energy, non-stop','amber',28],
  ['Deep Focus','Concentrate and unwind','blue',18],
  ['Feel Good Hits','Uplifting and timeless','pink',30]
];

const albums = [['Parallel Skies','BeatFlow Originals','violet'],['Chromatic','BeatFlow Originals','pink'],['Digital Gardens','BeatFlow Originals','blue'],['Heatwave','BeatFlow Originals','amber']];
const artists = [['Nova Lane','1.8M monthly listeners','sunset'],['Luna Grey','940K monthly listeners','violet'],['Mira Sol','762K monthly listeners','pink'],['Orion Vale','611K monthly listeners','blue']];

const $ = selector => document.querySelector(selector);
let currentTrack = 0;
let playing = false;
let elapsed = 0;
let audioContext;
let sequenceTimer;
let progressTimer;
let activeNotes = [];
const saved = new Set();

function formatTime(seconds){
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`;
}

function stopMusic(){
  clearInterval(sequenceTimer);
  clearInterval(progressTimer);
  activeNotes.forEach(note => { try { note.stop(); } catch {} });
  activeNotes = [];
}

function startMusic(){
  stopMusic();
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const track = tracks[currentTrack];
  let step = 0;
  const playNote = () => {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    oscillator.type = currentTrack % 2 ? 'sine' : 'triangle';
    oscillator.frequency.value = track.notes[step % track.notes.length];
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    const level = Math.max(.018, Number($('#volume').value) / 1500);
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + .025);
    gain.gain.exponentialRampToValueAtTime(.001, now + track.beat / 1100);
    oscillator.connect(filter).connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + track.beat / 1000);
    activeNotes.push(oscillator);
    oscillator.onended = () => activeNotes = activeNotes.filter(item => item !== oscillator);
    step++;
  };
  playNote();
  sequenceTimer = setInterval(playNote, track.beat);
  progressTimer = setInterval(() => {
    elapsed = elapsed >= track.duration ? 0 : elapsed + 1;
    updateProgress();
  }, 1000);
}

function togglePlay(){
  playing = !playing;
  if(playing) startMusic(); else stopMusic();
  $('#playButton').textContent = playing ? 'Ⅱ' : '▶';
  $('#playButton').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  $('#heroPlay').textContent = playing ? 'Ⅱ Pause' : '▶ Play now';
}

function selectTrack(index){
  currentTrack = (index + tracks.length) % tracks.length;
  elapsed = 0;
  updatePlayer();
  playing = true;
  startMusic();
  $('#playButton').textContent = 'Ⅱ';
  $('#heroPlay').textContent = 'Ⅱ Pause';
}

function updatePlayer(){
  const track = tracks[currentTrack];
  $('#trackTitle').textContent = track.title;
  $('#trackArtist').textContent = track.artist;
  $('#duration').textContent = formatTime(track.duration);
  $('#playerCover').className = `track-cover ${track.color}`;
  $('#favoriteButton').textContent = saved.has(track.title) ? '♥' : '♡';
  updateProgress();
}

function updateProgress(){
  const track = tracks[currentTrack];
  $('#currentTime').textContent = formatTime(elapsed);
  $('#progress').value = (elapsed / track.duration) * 100;
}

function renderContent(){
  $('#miniPlaylists').innerHTML = playlists.slice(0,3).map(item => `<a href="#playlists" class="mini-item"><span class="art ${item[2]}"></span><span><b>${item[0]}</b><small>${item[3]} tracks</small></span></a>`).join('');
  $('#playlistGrid').innerHTML = playlists.map((item,index) => `<article class="music-card"><div class="card-cover ${item[2]}"><button class="card-play" data-track="${index}" aria-label="Play ${item[0]}">▶</button></div><h3>${item[0]}</h3><p>${item[1]}</p><button class="like" data-save="${item[0]}" aria-label="Save ${item[0]}">♡</button></article>`).join('');
  $('#albumGrid').innerHTML = albums.map((item,index) => `<button class="album-card" data-track="${index}"><span class="album-art ${item[2]}">BF</span><span><b>${item[0]}</b><small>${item[1]} · 2026</small></span><em>▶</em></button>`).join('');
  $('#artistGrid').innerHTML = artists.map(item => `<article class="artist-card"><span class="artist-photo ${item[2]}">${item[0].split(' ').map(word=>word[0]).join('')}</span><h3>${item[0]}</h3><p>${item[1]}</p><button class="follow">Follow</button></article>`).join('');
}

document.addEventListener('click', event => {
  const playTarget = event.target.closest('[data-track]');
  if(playTarget) selectTrack(Number(playTarget.dataset.track));
  const saveTarget = event.target.closest('[data-save]');
  if(saveTarget){ const name = saveTarget.dataset.save; saved.has(name) ? saved.delete(name) : saved.add(name); saveTarget.textContent = saved.has(name) ? '♥' : '♡'; saveTarget.classList.toggle('saved',saved.has(name)); }
  const follow = event.target.closest('.follow');
  if(follow){ follow.classList.toggle('following'); follow.textContent = follow.classList.contains('following') ? 'Following' : 'Follow'; }
});

$('#playButton').addEventListener('click',togglePlay);
$('#heroPlay').addEventListener('click',togglePlay);
$('#nextButton').addEventListener('click',()=>selectTrack(currentTrack+1));
$('#previousButton').addEventListener('click',()=>selectTrack(currentTrack-1));
$('#favoriteButton').addEventListener('click',()=>{ const name=tracks[currentTrack].title; saved.has(name)?saved.delete(name):saved.add(name); updatePlayer(); });
$('#progress').addEventListener('input',event=>{ elapsed=Math.round((event.target.value/100)*tracks[currentTrack].duration); updateProgress(); });
$('#saveAlbum').addEventListener('click',event=>{ event.target.classList.toggle('saved'); event.target.textContent=event.target.classList.contains('saved')?'✓ Saved':'＋ Save'; });
$('#menuButton').addEventListener('click',()=>$('#sidebar').classList.add('open'));
$('#closeMenu').addEventListener('click',()=>$('#sidebar').classList.remove('open'));

$('#searchInput').addEventListener('input',event=>{
  const query=event.target.value.trim().toLowerCase();
  $('#mainContent').classList.toggle('hidden',Boolean(query));
  $('#searchResults').classList.toggle('hidden',!query);
  if(!query)return;
  $('#searchTitle').textContent=`Results for “${event.target.value}”`;
  const found=tracks.filter(track=>`${track.title} ${track.artist}`.toLowerCase().includes(query));
  $('#resultsList').innerHTML=found.length?found.map(track=>{const index=tracks.indexOf(track);return `<button class="result" data-track="${index}"><span class="album-art ${track.color}"></span><span><b>${track.title}</b><small>${track.artist}</small></span><em>${formatTime(track.duration)}</em><span>▶</span></button>`}).join(''):'<p class="empty">No tracks found. Try “Neon” or “BeatFlow”.</p>';
});

renderContent();
updatePlayer();
