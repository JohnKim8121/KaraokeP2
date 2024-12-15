import { config } from './config.js';

class YouTubeHandler {
    constructor() {
        this.apiKey = config.YOUTUBE_API_KEY;
        this.player = null;
        this.currentVideoIndex = 0;
        this.playlist = [];
        this.audioProcessor = null;
        
        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Bind methods
        this.onPlayerReady = this.onPlayerReady.bind(this);
        this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
        
        // Setup event listeners
        window.onYouTubeIframeAPIReady = () => this.initializePlayer();
    }

    initializePlayer() {
        this.player = new YT.Player('videoPlayer', {
            height: '360',
            width: '640',
            videoId: '',
            events: {
                'onReady': this.onPlayerReady,
                'onStateChange': this.onPlayerStateChange
            },
            playerVars: {
                enablejsapi: 1,
                origin: window.location.origin
            }
        });
    }

    setAudioProcessor(processor) {
        this.audioProcessor = processor;
    }

    onPlayerReady(event) {
        // Player is ready
        if (this.audioProcessor) {
            this.audioProcessor.connectYouTubePlayer(this.player);
        }
        const volumeSlider = document.getElementById('youtubeVolume');
        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });
    }

    onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            this.playNext();
        }
    }

    async searchVideos(query) {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${this.apiKey}`
        );
        const data = await response.json();
        this.displaySearchResults(data.items);
    }

    displaySearchResults(items) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';
        
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'search-result';
            div.innerHTML = `
                <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
                <div class="video-info">
                    <h3>${item.snippet.title}</h3>
                    <p>${item.snippet.channelTitle}</p>
                </div>
            `;
            div.addEventListener('click', () => {
                this.playlist = items;
                this.currentVideoIndex = index;
                this.loadVideo(item.id.videoId);
            });
            searchResults.appendChild(div);
        });
    }

    loadVideo(videoId) {
        if (this.player) {
            if (this.audioProcessor) {
                this.audioProcessor.analyzer.endSong();
            }
            this.player.loadVideoById(videoId);
            setTimeout(() => {
                if (this.audioProcessor) {
                    this.audioProcessor.analyzer.startNewSong(
                        videoId,
                        this.player.getVideoData().title
                    );
                }
            }, 1000);
        }
    }

    playPause() {
        if (!this.player) return;
        
        const state = this.player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }

    playNext() {
        if (this.currentVideoIndex < this.playlist.length - 1) {
            this.currentVideoIndex++;
            this.loadVideo(this.playlist[this.currentVideoIndex].id.videoId);
        }
    }

    playPrevious() {
        if (this.currentVideoIndex > 0) {
            this.currentVideoIndex--;
            this.loadVideo(this.playlist[this.currentVideoIndex].id.videoId);
        }
    }

    setVolume(value) {
        if (this.player) {
            this.player.setVolume(value);
        }
    }
}

export default YouTubeHandler; 