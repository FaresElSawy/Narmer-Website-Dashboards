# Poppins web fonts

English typography approved by the owner on 23 October 2026, replacing Brice in both websites and dashboards. Arabic continues to use the supplied Cairo fonts.

The three unmodified, normal-style Latin WOFF2 files are Regular (400), SemiBold (600) and Bold (700). They were downloaded from the official Google Fonts Poppins stylesheet and are self-hosted. Other scripts use their language font or the system fallback; no external font service is contacted by the website.

Sources: [Poppins on Google Fonts](https://fonts.google.com/specimen/Poppins), [official font repository](https://github.com/google/fonts/tree/main/ofl/poppins), and the accompanying [SIL Open Font License](OFL.txt). The build copies this license to `dist/licenses/poppins-OFL.txt`.

Font declarations are centralized in `shared/assets/css/fonts.css`; do not duplicate these binaries or declarations inside each website folder. The owner's original Brice files remain preserved in `Files/Fonts` as supplied references.
