class ScoreManager {
    constructor() {
        this.currentSession = {
            videoId: null,
            videoTitle: null,
            accuracyHistory: [],
            maxStreak: 0,
            startTime: null
        };
        this.loadScoreHistory();
        this.updateLiveHistory();
    }

    startNewSession(videoId, videoTitle) {
        this.currentSession = {
            videoId,
            videoTitle,
            accuracyHistory: [],
            maxStreak: 0,
            startTime: new Date()
        };
    }

    updateAccuracy(accuracy, streak) {
        this.currentSession.accuracyHistory.push(accuracy);
        this.currentSession.maxStreak = Math.max(this.currentSession.maxStreak, streak);
    }

    endSession() {
        if (this.currentSession.accuracyHistory.length === 0) return null;

        const sessionScore = {
            videoId: this.currentSession.videoId,
            videoTitle: this.currentSession.videoTitle,
            averageAccuracy: this.calculateAverageAccuracy(),
            maxStreak: this.currentSession.maxStreak,
            finalScore: this.calculateFinalScore(),
            date: new Date(),
            duration: new Date() - this.currentSession.startTime
        };

        this.saveScore(sessionScore);
        return sessionScore;
    }

    calculateAverageAccuracy() {
        const sum = this.currentSession.accuracyHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.currentSession.accuracyHistory.length);
    }

    calculateFinalScore() {
        const avgAccuracy = this.calculateAverageAccuracy();
        const streakBonus = this.currentSession.maxStreak * 10;
        const rawScore = avgAccuracy + (streakBonus / 100);
        return Math.min(100, Math.max(0, Math.round(rawScore)));
    }

    saveScore(score) {
        const scores = this.loadScoreHistory();
        scores.unshift(score);
        if (scores.length > 10) scores.pop();
        localStorage.setItem('scoreHistory', JSON.stringify(scores));
        this.updateLiveHistory();
    }

    loadScoreHistory() {
        const scores = localStorage.getItem('scoreHistory');
        return scores ? JSON.parse(scores) : [];
    }

    updateLiveHistory() {
        const historyPanel = document.getElementById('liveScoreHistory');
        if (!historyPanel) return;

        const scores = this.loadScoreHistory();
        historyPanel.innerHTML = scores
            .map(s => `
                <div class="history-entry">
                    <div class="song-title">${s.videoTitle}</div>
                    <div class="score-info">
                        <span>Score: ${s.finalScore}%</span>
                        <span>Accuracy: ${s.averageAccuracy}%</span>
                    </div>
                </div>
            `)
            .join('');
    }

    displayScoreModal(score) {
        const modal = document.getElementById('scoreModal');
        const finalScore = document.getElementById('finalScore');
        const averageAccuracy = document.getElementById('averageAccuracy');
        const maxStreak = document.getElementById('maxStreak');
        const scoreHistory = document.getElementById('scoreHistory');

        finalScore.textContent = `${score.finalScore}%`;
        averageAccuracy.textContent = score.averageAccuracy;
        maxStreak.textContent = score.maxStreak;

        scoreHistory.innerHTML = this.loadScoreHistory()
            .map(s => `
                <div class="score-entry">
                    <div class="score-info">
                        <strong>${s.videoTitle}</strong>
                        <div class="score-details">
                            <span>Score: ${s.finalScore}%</span>
                            <span>Accuracy: ${s.averageAccuracy}%</span>
                        </div>
                    </div>
                    <div class="score-date">
                        ${new Date(s.date).toLocaleDateString()}
                    </div>
                </div>
            `).join('');

        modal.style.display = 'block';
    }
}

export default ScoreManager; 