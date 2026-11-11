onmessage = async ({ data: { canvas, work } }) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const ctx = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: 'premultiplied' });
  const module = device.createShaderModule({ code: `
    struct U { n: u32, work: u32, w: f32, h: f32 };
    @group(0) @binding(0) var<uniform> u: U;
    @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
      let p = array(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));
      return vec4f(p[i], 0, 1);
    }
    @fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
      let x = pos.x / u.w; let y = pos.y / u.h;
      if (y < 0.07) {
        // bit 15 on the left
        let bit = 15u - u32(x * 16.0);
        let on = (u.n >> bit) & 1u;
        return select(vec4f(0, 0, 0, 1), vec4f(1, 1, 1, 1), on == 1u);
      }
      // busy work, so that a frame takes the GPU a while
      var a = 0.0;
      for (var i = 0u; i < u.work; i++) { a = fract(a * 1.37 + sin(f32(i) + pos.x * 0.01)); }
      let stripe = fract((pos.x + f32(u.n) * 6.0) / 120.0) < 0.5;
      let base = select(vec3f(0.2, 0.4, 0.8), vec3f(0.9, 0.8, 0.3), stripe);
      return vec4f(base + a * 0.0001, 1);
    }` });
  const pipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module, entryPoint: 'vs' },
    fragment: { module, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });
  const ubuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const bind = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubuf } }] });
  let n = 0;
  postMessage({ ok: true });
  const frame = () => {
    n++;
    const u = new ArrayBuffer(16); new Uint32Array(u, 0, 2).set([n, work]); new Float32Array(u, 8, 2).set([canvas.width, canvas.height]);
    device.queue.writeBuffer(ubuf, 0, u);
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [1, 0, 1, 1] }] });
    pass.setPipeline(pipeline); pass.setBindGroup(0, bind); pass.draw(3); pass.end();
    device.queue.submit([enc.finish()]);
    postMessage({ n });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};
