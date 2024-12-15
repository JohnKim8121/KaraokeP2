import { SuperpoweredWebAudio } from './Superpowered.js';

function calculateFrequency(value, minFreq, maxFreq) {
    if (value > 0.97) return maxFreq;
    if (value < 0.03) return minFreq;
    return Math.min(maxFreq, Math.pow(10.0, (value + ((0.4 - Math.abs(value - 0.4)) * 0.3)) * Math.log10(maxFreq - minFreq)) + minFreq);
}

class MyProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
    onReady() {
        this.processorOptions = {
            bufferSize: 8,
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 2,
            processingMode: 'realtime',
            quantum: 4,
            preferredQuantum: 4
        };
        
        this.reverb = new this.Superpowered.Reverb(this.samplerate, this.samplerate);
        this.reverb.enabled = true;

        this.filter = new this.Superpowered.Filter(this.Superpowered.Filter.Resonant_Lowpass, this.samplerate);
        this.filter.resonance = 0.2;
        this.filter.enabled = true;

        if (typeof scheduler !== 'undefined' && scheduler.postTask) {
            scheduler.postTask(() => {}, {priority: 'user-blocking'});
        }
    }

    onDestruct() {
        this.reverb.destruct();
        this.filter.destruct();
    }

    onMessageFromMainScope(message) {
        if (typeof message.wet !== 'undefined') {
            this.reverb.wet = message.wet / 100;
            console.log(message.wet + '%');
        } else if (typeof message.freq !== 'undefined') {
            let hz = calculateFrequency(parseFloat(message.freq) / 100, 100, 10000);
            this.filter.frequency = hz;
            console.log(parseInt(hz, 10) + ' hz');
        } else if (typeof message.volume !== 'undefined') {
            // Handle volume control
            console.log('Volume:', message.volume);
        }
    }

    processAudio(inputBuffer, outputBuffer, buffersize, parameters) {
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => {}, { timeout: 0 });
        }

        const chunkSize = 4;
        for (let i = 0; i < buffersize; i += chunkSize) {
            const currentSize = Math.min(chunkSize, buffersize - i);
            if (this.reverb.wet === 0) {
                this.filter.process(
                    inputBuffer.pointer + (i * 8),
                    outputBuffer.pointer + (i * 8),
                    currentSize
                );
            } else {
                this.reverb.process(
                    inputBuffer.pointer + (i * 8),
                    inputBuffer.pointer + (i * 8),
                    currentSize
                );
                this.filter.process(
                    inputBuffer.pointer + (i * 8),
                    outputBuffer.pointer + (i * 8),
                    currentSize
                );
            }
        }
    }
}

if (typeof AudioWorkletProcessor === 'function') registerProcessor('MyProcessor', MyProcessor);
export default MyProcessor;
