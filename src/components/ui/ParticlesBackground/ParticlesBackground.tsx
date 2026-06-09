'use client';

import { Particles, ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';

const OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'grab' },
      resize: { enable: true },
    },
    modes: {
      grab: { distance: 140, links: { opacity: 0.4 } },
    },
  },
  particles: {
    color: { value: '#4d76ff' },
    links: {
      color: '#4d76ff',
      distance: 150,
      enable: true,
      opacity: 0.12,
      width: 1,
    },
    move: {
      direction: 'none' as const,
      enable: true,
      outModes: { default: 'bounce' as const },
      random: false,
      speed: 0.6,
      straight: false,
    },
    number: {
      density: { enable: true, area: 900 },
      value: 55,
    },
    opacity: { value: 0.22 },
    shape: { type: 'circle' },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
} as const;

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

export function ParticlesBackground() {
  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="bg-particles"
        options={OPTIONS}
        className="fixed inset-0 -z-10"
      />
    </ParticlesProvider>
  );
}

ParticlesBackground.displayName = 'ParticlesBackground';
