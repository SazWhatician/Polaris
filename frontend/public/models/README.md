# Custom 3D Models Directory

Place your `.glb` or `.gltf` 3D model files in this folder.

### How to use your custom 3D model in the footer:

In `frontend/app/page.tsx`, pass your model's path to `<ReactorFooter />`:

```tsx
<ReactorFooter customModelUrl="/models/my-custom-model.glb" />
```

### Auto-Fit & Normalization:
- Any 3D model placed here is **automatically centered and scaled** to fit inside the footer reactor chamber.
- It will automatically receive the same breathing pulse animation, 3D lighting, and interactive mouse parallax tracking.
- You can optionally adjust the scale factor with `modelScale`:

```tsx
<ReactorFooter customModelUrl="/models/my-custom-model.glb" modelScale={1.2} />
```
