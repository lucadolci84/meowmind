export async function startMicStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
    });
}

export async function recordAudio(
    stream: MediaStream,
    durationMs = 4000
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
        };

        recorder.onerror = () => reject(new Error("Errore registrazione audio"));
        recorder.onstop = () => resolve(new Blob(chunks, { type: "audio/webm" }));

        recorder.start();
        setTimeout(() => recorder.stop(), durationMs);
    });
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();
    return audioBuffer;
}

export function getMonoData(audioBuffer: AudioBuffer): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    return new Float32Array(channelData);
}

export function computeRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
        sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
}

export function computeZeroCrossingRate(samples: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
        const prev = samples[i - 1];
        const curr = samples[i];
        if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
            crossings++;
        }
    }
    return crossings / samples.length;
}

export function estimatePitch(samples: Float32Array, sampleRate: number): number {
    const minFreq = 25;
    const maxFreq = 1800;

    let bestLag = -1;
    let bestCorr = 0;

    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);

    for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        for (let i = 0; i < samples.length - lag; i++) {
            corr += samples[i] * samples[i + lag];
        }
        if (corr > bestCorr) {
            bestCorr = corr;
            bestLag = lag;
        }
    }

    if (bestLag === -1) return 0;
    return sampleRate / bestLag;
}

export function computeLowBandRatio(
    samples: Float32Array,
    sampleRate: number
): number {
    const n = Math.min(4096, samples.length);
    if (n < 512) return 0;

    let total = 0;
    let low = 0;

    for (let k = 1; k < Math.floor(n / 2); k++) {
        let real = 0;
        let imag = 0;

        for (let i = 0; i < n; i++) {
            const phase = (2 * Math.PI * k * i) / n;
            real += samples[i] * Math.cos(phase);
            imag -= samples[i] * Math.sin(phase);
        }

        const power = real * real + imag * imag;
        const freq = (k * sampleRate) / n;

        total += power;
        if (freq >= 20 && freq <= 180) {
            low += power;
        }
    }

    if (total <= 0) return 0;
    return low / total;
}

export async function extractAudioFeatures(blob: Blob) {
    const audioBuffer = await decodeAudioBlob(blob);
    const samples = getMonoData(audioBuffer);

    const rms = computeRMS(samples);
    const zcr = computeZeroCrossingRate(samples);
    const pitchEstimate = estimatePitch(
        samples.slice(0, Math.min(samples.length, Math.floor(audioBuffer.sampleRate * 1.5))),
        audioBuffer.sampleRate
    );
    const lowBandRatio = computeLowBandRatio(samples, audioBuffer.sampleRate);

    return {
        durationSec: audioBuffer.duration,
        rms,
        zcr,
        pitchEstimate,
        lowBandRatio
    };
}