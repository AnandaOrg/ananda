import { useTranslations } from "next-intl";
import { mu, MU_VAR } from "./mobile/scale";

const ud = (n: number) => `calc(var(--ud) * ${n})`;
const UD_VAR = { ["--ud" as string]: "calc(100cqw / 1440)" } as const;
const getCurrentYear = () => new Date().getFullYear();

function Socials({ scale }: { scale: (n: number) => string }) {
  return (
    <div className="flex items-center" style={{ gap: scale(14) }}>
      <a href="https://www.linkedin.com/company/ananda-cocktails" target="_blank" rel="noopener noreferrer"><img src="/m-linkedin.svg" alt="LinkedIn" style={{ width: scale(39), height: scale(39) }} /></a>
      <a href="https://www.facebook.com/anandacocktails.eu/" target="_blank" rel="noopener noreferrer"><img src="/m-facebook.svg" alt="Facebook" style={{ width: scale(39), height: scale(39) }} /></a>
      <a href="https://www.instagram.com/ananda_cocktails_bg/" target="_blank" rel="noopener noreferrer"><img src="/m-instagram.svg" alt="X" style={{ width: scale(39), height: scale(39) }} /></a>
    </div>
  );
}

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-[#eb4638]" style={{ containerType: "inline-size" }}>
      <div className="flex justify-center md:hidden">
        <div className="w-full" style={{ containerType: "inline-size" }}>
          <div className="flex flex-col" style={{ ...MU_VAR, padding: `${mu(60)} ${mu(24)}`, gap: mu(40) }}>
            <div className="h-px w-full bg-[#fff0e5]" />
            <div className="flex flex-col items-center" style={{ gap: mu(32) }}>
              <img src="/ananda-logo.svg" alt="ANANDA Cocktails" style={{ width: mu(152.482), height: "auto" }} />
              <Socials scale={mu} />
              <p className="text-center text-[#fff0e5]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: mu(14), lineHeight: mu(18), width: mu(280) }}>
                {t("copyright", { year: getCurrentYear() })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block" style={UD_VAR}>
        <div className="flex flex-col" style={{ padding: ud(80), gap: ud(40) }}>
          <div className="h-px w-full bg-[#fff0e5]" />
          <div className="flex w-full items-end justify-between">
            <img src="/ananda-logo.svg" alt="ANANDA Cocktails" style={{ width: ud(152.482), height: "auto" }} />
            <p className="text-center text-[#fff0e5]" style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: ud(14), lineHeight: ud(14), width: ud(280) }}>
              {t("copyright", { year: getCurrentYear() })}
            </p>
            <Socials scale={ud} />
          </div>
        </div>
      </div>
    </footer>
  );
}
