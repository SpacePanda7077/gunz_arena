export class GunSoundPool {
    private sounds: Phaser.Sound.BaseSound[] = [];
    private index = 0;

    constructor(scene: Phaser.Scene, key: string, poolSize: number = 8) {
        for (let i = 0; i < poolSize; i++) {
            const sound = scene.sound.add(key, {
                volume: 0.7,
                rate: 1.0,
            });
            this.sounds.push(sound);
        }
    }

    play() {
        const sound = this.sounds[this.index];
        if (sound) {
            sound.stop(); // Stop previous use of this instance
            sound.play();
        }
        this.index = (this.index + 1) % this.sounds.length;
    }

    destroy() {
        this.sounds.forEach((s) => s.destroy());
        this.sounds = [];
    }
}
