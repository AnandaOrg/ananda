import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "app/PouchScroll.tsx",
      "app/KyotoLiftoff.tsx",
      "app/RitualCards.tsx",
      "app/Manifesto.tsx",
      "app/FlavorModal.tsx",
      "app/Footer.tsx",
      "app/DropList.tsx",
      "app/Pathways.tsx",
      "app/mobile/MobilePathways.tsx",
      "app/mobile/MobileRitual.tsx",
      "app/mobile/MobileKyoto.tsx",
      "app/mobile/MobilePouchScroll.tsx",
      "app/mobile/MobileAbout.tsx",
      "app/MediaSkeleton.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["app/GlbViewer.tsx"],
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);

export default eslintConfig;
