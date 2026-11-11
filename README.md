# Firefox WebGPU stale frames repro

Minimal repro for [Firefox bug 2091844](https://bugzilla.mozilla.org/show_bug.cgi?id=2091844): a WebGPU canvas drawn from a worker briefly shows older frames when anything else on the page changes.

- With a DOM change each frame: https://code.sargunv.dev/firefox-webgpu-stale-frames/?work=300&dom=1
- Without: https://code.sargunv.dev/firefox-webgpu-stale-frames/?work=300

A worker draws the frame number as 16 black/white blocks along the top of the canvas, and stripes that move right each frame. `work` sets how long each frame takes the GPU. `dom=1` rotates the red square beside the canvas every frame. In Firefox on macOS, with `dom=1`, the stripes sometimes jump back and the frame number goes down.

*AI-assisted — Tool: Claude Code; model: anthropic/claude-opus-5-5*
