import AudioProcessor from './audio-processor.js';
import YouTubeHandler from './youtube-handler.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize handlers
        const youtubeHandler = new YouTubeHandler();
        const audioProcessor = new AudioProcessor();
        youtubeHandler.setAudioProcessor(audioProcessor);

        // Connect YouTube player when it's ready
        youtubeHandler.onPlayerReady = async (event) => {
            try {
                const volumeSlider = document.getElementById('youtubeVolume');
                volumeSlider.addEventListener('input', (e) => {
                    youtubeHandler.setVolume(e.target.value);
                });
            } catch (error) {
                console.error('Error connecting YouTube player:', error);
            }
        };

        // Setup search functionality
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');

        searchButton.addEventListener('click', () => {
            youtubeHandler.searchVideos(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                youtubeHandler.searchVideos(searchInput.value);
            }
        });

        // Setup playback controls
        document.getElementById('playPauseButton').addEventListener('click', () => {
            youtubeHandler.playPause();
        });

        document.getElementById('nextButton').addEventListener('click', () => {
            youtubeHandler.playNext();
        });

        document.getElementById('prevButton').addEventListener('click', () => {
            youtubeHandler.playPrevious();
        });
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}); 