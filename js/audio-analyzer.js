import ScoreManager from './score-manager.js';

class AudioAnalyzer {
    constructor() {
        this.analyserNode = null;
        this.dataArray = null;
        this.streak = 0;
        this.accuracy = 0;
        this.lastMatch = false;
        this.scoreManager = new ScoreManager();
        
        // Display elements
        this.accuracyBar = document.getElementById('accuracyBar');
        this.accuracyPercent = document.getElementById('accuracyPercent');
        
        // Setup modal close button
        document.getElementById('closeModal').onclick = () => {
            document.getElementById('scoreModal').style.display = 'none';
        };
    }

    initialize(audioContext) {
        this.analyserNode = audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048;
        this.dataArray = new Float32Array(this.analyserNode.frequencyBinCount);
    }

    getFrequencyData() {
        this.analyserNode.getFloatFrequencyData(this.dataArray);
        return this.dataArray;
    }

    compareFrequencies(micData, videoData) {
        // Calculate average frequency difference
        let totalDiff = 0;
        let significantFreqs = 0;

        for (let i = 0; i < micData.length; i++) {
            // Only compare frequencies above certain threshold
            if (micData[i] > -70 || videoData[i] > -70) {
                const diff = Math.abs(micData[i] - videoData[i]);
                totalDiff += diff;
                significantFreqs++;
            }
        }

        // Calculate match percentage (0-100)
        const avgDiff = totalDiff / (significantFreqs || 1);
        const matchPercentage = Math.max(0, 100 - (avgDiff * 2));

        this.updateScore(matchPercentage);
        return matchPercentage;
    }

    updateScore(matchPercentage) {
        const isMatch = matchPercentage > 70;

        if (isMatch) {
            if (this.lastMatch) {
                this.streak++;
            } else {
                this.streak = 1;
            }
        } else {
            this.streak = 0;
        }

        this.lastMatch = isMatch;
        this.accuracy = matchPercentage;
        this.scoreManager.updateAccuracy(matchPercentage, this.streak);

        // Update display
        this.updateDisplay();
    }

    updateDisplay() {
        this.accuracyBar.style.width = `${this.accuracy}%`;
        this.accuracyPercent.textContent = Math.round(this.accuracy);
    }

    startNewSong(videoId, videoTitle) {
        this.scoreManager.startNewSession(videoId, videoTitle);
    }

    endSong() {
        const finalScore = this.scoreManager.endSession();
        if (finalScore) {
            this.scoreManager.displayScoreModal(finalScore);
        }
    }
}

export default AudioAnalyzer; 