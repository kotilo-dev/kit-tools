# kit-tools

Signed community tools for [Kotilo Kit](https://github.com/kotilo-dev/kotilo-kit). Each tool is one `defineTool` file that runs in Kit's plugin sandbox (QuickJS, no network, no file system).

```
kotilo kit add slug
```

Kit downloads `index.json`, checks its ed25519 signature against the public key built into the app, then downloads the tool file and checks its sha256. It asks for your consent every time. This is the only network call Kit ever makes.

## Adding a tool

1. `tools/<id>.ts`: the tool. The file name must be the tool id (`a-z`, `0-9`, `-`). Use `import { defineTool, fail } from '@kotilo/kit-core'`; nothing else can be imported.
2. `tools/<id>.json`: `{ "version": "1.0.0", "summary": { "en": "…", "tr": "…" } }`. Bump `version` with every change.
3. Add at least one `examples` entry. CI runs each example in the sandbox with both `en` and `tr` locales.
4. Open a PR. After it is merged, CI signs the new `index.json` and publishes it.

Plugin API: [docs/03-architecture.md](https://github.com/kotilo-dev/kotilo-kit/blob/main/docs/03-architecture.md).

## Published files

`https://kotilo-dev.github.io/kit-tools/`: `index.json`, `index.json.sig` (base64 ed25519 signature over `index.json`) and `tools/<id>.ts`. `index.json` pins every tool file by sha256.

---

# kit-tools (TR)

[Kotilo Kit](https://github.com/kotilo-dev/kotilo-kit) için imzalı topluluk araçları. Her araç, Kit'in eklenti sandbox'ında (QuickJS; ağ ve dosya sistemi yok) çalışan tek bir `defineTool` dosyasıdır.

`kotilo kit add slug` önce `index.json`'u indirir ve imzasını uygulamaya gömülü açık anahtarla doğrular. Sonra araç dosyasını indirip sha256'sını kontrol eder. Her seferinde onay ister; Kit'in yaptığı tek ağ çağrısı budur.

Araç eklemek için `tools/<id>.ts` ve `tools/<id>.json` dosyalarını ekleyip PR aç. En az bir `examples` girdisi zorunlu; CI her örneği hem `en` hem `tr` ile çalıştırır.
