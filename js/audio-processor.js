import { SuperpoweredGlue, SuperpoweredWebAudio } from '../superpowered/Superpowered.js';
import AudioAnalyzer from './audio-analyzer.js';

class AudioProcessor {
    constructor() {
        this.webaudioManager = null;
        this.Superpowered = null;
        this.audioNode = null;
        this.isInitialized = false;
        this.isMicEnabled = false;
        this.analyzer = new AudioAnalyzer();
        this.micAnalyser = null;
        this.videoAnalyser = null;

        // Initialize controls
        this.initializeControls();
        this.initialize();
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialize Superpowered
            this.Superpowered = await SuperpoweredGlue.Instantiate('ExampleLicenseKey-WillExpire-OnNextUpdate');
            
            // Initialize Web Audio with optimized settings
            this.webaudioManager = new SuperpoweredWebAudio(48000, this.Superpowered, {
                latencyHint: 'interactive',
                powerPreference: 'high-performance',
                processorOptions: {
                    bufferSize: 8
                }
            });

            // Request optimal audio context settings
            const audioContextOptions = {
                latencyHint: 'interactive',
                sampleRate: 48000,
                preferredSampleRate: 96000,
                powerPreference: 'high-performance'
            };

            // Request high-priority thread
            if (navigator.scheduling && navigator.scheduling.isInputPending) {
                navigator.scheduling.isInputPending({
                    includeContinuous: true,
                    includeSignals: true
                });
            }

            if (this.webaudioManager.audioContext.close) {
                this.webaudioManager.audioContext.close();
                this.webaudioManager.audioContext = new AudioContext(audioContextOptions);
            }

            // Additional optimization
            if (this.webaudioManager.audioContext.audioWorklet) {
                await this.webaudioManager.audioContext.audioWorklet.addModule('superpowered/processor.js', {
                    credentials: 'omit',
                    priority: 'high'
                });
            }

            let currentPath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
            this.audioNode = await this.webaudioManager.createAudioNodeAsync(
                currentPath + '/superpowered/processor.js',
                'MyProcessor',
                this.onMessageFromAudioScope.bind(this)
            );

            // Set audio node options for lower latency
            if (this.audioNode.port) {
                this.audioNode.port.postMessage({ 
                    command: 'setOptions',
                    options: {
                        numberOfInputs: 1,
                        numberOfOutputs: 1,
                        outputChannelCount: [2],
                        processorOptions: {
                            bufferSize: 8
                        }
                    }
                });
            }

            // Initialize analyzers
            this.analyzer.initialize(this.webaudioManager.audioContext);
            this.micAnalyser = this.webaudioManager.audioContext.createAnalyser();
            this.videoAnalyser = this.webaudioManager.audioContext.createAnalyser();
            
            // Start analysis loop
            this.startAnalysis();

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio processor:', error);
        }
    }

    startAnalysis() {
        const analyzeFrame = () => {
            if (this.isMicEnabled && this.micAnalyser && this.videoAnalyser) {
                const micData = new Float32Array(this.micAnalyser.frequencyBinCount);
                const videoData = new Float32Array(this.videoAnalyser.frequencyBinCount);
                
                this.micAnalyser.getFloatFrequencyData(micData);
                this.videoAnalyser.getFloatFrequencyData(videoData);
                
                this.analyzer.compareFrequencies(micData, videoData);
            }
            requestAnimationFrame(analyzeFrame);
        };
        
        analyzeFrame();
    }

    onMessageFromAudioScope(message) {
        console.log('Message from audio scope:', message);
    }

    async toggleMicrophone() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isMicEnabled) {
            this.disableMicrophone();
        } else {
            await this.enableMicrophone();
        }
    }

    async enableMicrophone() {
        try {
            const stream = await this.webaudioManager.getUserMediaForAudioAsync({
                fastAndTransparentAudio: true,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                latency: 0.0001,
                channelCount: 2,
                sampleRate: 96000,
                sampleSize: 16,
                preferredSampleRate: 96000,
                priority: 'very high'
            });

            const audioInput = this.webaudioManager.audioContext.createMediaStreamSource(stream);
            audioInput.channelCount = 2;
            audioInput.channelCountMode = 'explicit';
            audioInput.channelInterpretation = 'speakers';
            audioInput.connect(this.micAnalyser);
            audioInput.connect(this.audioNode);
            this.audioNode.connect(this.webaudioManager.audioContext.destination);
            
            await this.webaudioManager.audioContext.resume();
            
            this.isMicEnabled = true;
            document.getElementById('toggleMic').textContent = 'Disable Microphone';
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }

    disableMicrophone() {
        if (this.webaudioManager && this.webaudioManager.audioContext) {
            this.audioNode.disconnect();
            this.webaudioManager.audioContext.close();
            this.isMicEnabled = false;
            document.getElementById('toggleMic').textContent = 'Enable Microphone';
        }
    }

    initializeControls() {
        // Mic toggle
        document.getElementById('toggleMic').addEventListener('click', () => this.toggleMicrophone());

        // Volume control
        document.getElementById('micVolume').addEventListener('input', (e) => {
            if (this.audioNode) {
                this.audioNode.sendMessageToAudioScope({ volume: e.target.value / 100 });
            }
        });

        // Reverb control
        document.getElementById('reverbMix').addEventListener('input', (e) => {
            if (this.audioNode) {
                this.audioNode.sendMessageToAudioScope({ wet: e.target.value });
            }
        });

        // Filter control
        document.getElementById('filterFreq').addEventListener('input', (e) => {
            if (this.audioNode) {
                this.audioNode.sendMessageToAudioScope({ freq: e.target.value });
            }
        });
    }

    connectYouTubePlayer(player) {
        if (!this.webaudioManager || !this.audioNode) return;
        
        try {
            // Get the iframe element
            const iframe = player.getIframe();
            
            // Create a media element source from the iframe
            const source = this.webaudioManager.audioContext.createMediaElementSource(iframe);
            source.connect(this.videoAnalyser);
            source.connect(this.audioNode);

        } catch (error) {
            console.error('Error connecting YouTube audio:', error);
        }
    }

    // Add cleanup method
    disconnectYouTubePlayer() {
        if (this.audioNode) {
            this.audioNode.disconnect();
        }
    }
}

export default AudioProcessor; 