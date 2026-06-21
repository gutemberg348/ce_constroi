import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function SvgIcon({ children, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        clipRule="evenodd"
        d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.95 2.65a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
        fillRule="evenodd"
      />
    </SvgIcon>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14.2 8.2V6.7c0-.74.5-.92.86-.92h2.18V2.13L14.23 2C10.9 2 10.15 4.48 10.15 6.08V8.2H7.5v3.85h2.65V22h4.05v-9.95h3.02l.4-3.85H14.2Z" />
    </SvgIcon>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        clipRule="evenodd"
        d="M21.58 7.19a2.68 2.68 0 0 0-1.88-1.9C18.03 4.85 12 4.85 12 4.85s-6.03 0-7.7.44a2.68 2.68 0 0 0-1.88 1.9A27.9 27.9 0 0 0 2 12a27.9 27.9 0 0 0 .42 4.81 2.68 2.68 0 0 0 1.88 1.9c1.67.44 7.7.44 7.7.44s6.03 0 7.7-.44a2.68 2.68 0 0 0 1.88-1.9A27.9 27.9 0 0 0 22 12a27.9 27.9 0 0 0-.42-4.81ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z"
        fillRule="evenodd"
      />
    </SvgIcon>
  );
}

export function XSocialIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16.86 2h3.18l-6.95 7.95L21.27 22h-6.4l-5.01-6.56L4.12 22H.93l7.44-8.5L.52 2h6.56l4.53 5.99L16.86 2Zm-1.12 17.88h1.76L6.12 4.02H4.23l11.51 15.86Z" />
    </SvgIcon>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16.02 2c.37 3.12 2.12 4.98 5.14 5.18v3.5a8.12 8.12 0 0 1-5.08-1.63v6.55c0 4.31-2.96 6.4-6.25 6.4A5.84 5.84 0 0 1 4 16.17c0-3.7 3.18-6.37 7.04-5.76v3.66c-1.6-.5-3.45.3-3.45 2.1a2.17 2.17 0 0 0 2.22 2.15c1.26 0 2.42-.75 2.42-2.84V2h3.79Z" />
    </SvgIcon>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96ZM3 9.55h3.95V22H3V9.55Zm6.28 0h3.78v1.7h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.74 2.64 4.74 6.07V22h-3.94v-5.96c0-1.42-.02-3.25-1.98-3.25-1.99 0-2.29 1.55-2.29 3.15V22H9.28V9.55Z" />
    </SvgIcon>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        clipRule="evenodd"
        d="M12.04 2a9.83 9.83 0 0 0-8.48 14.8L2.25 22l5.33-1.25A9.83 9.83 0 1 0 12.04 2Zm0 2a7.82 7.82 0 0 1 6.66 11.93 7.82 7.82 0 0 1-9.95 2.86l-.38-.2-3.2.75.78-3.05-.24-.4A7.82 7.82 0 0 1 12.04 4Zm-3.2 4.2c.17-.38.35-.4.52-.4h.45c.14 0 .34.05.52.43.17.38.6 1.48.65 1.59.06.1.09.23.02.38-.07.16-.1.25-.22.39l-.32.38c-.1.12-.22.25-.1.48.12.23.55.9 1.18 1.45.81.72 1.5.95 1.73 1.06.23.12.37.1.5-.06.16-.18.58-.68.74-.91.16-.23.31-.2.52-.12.22.08 1.37.65 1.6.76.24.12.4.18.46.28.06.1.06.6-.14 1.18-.2.57-1.17 1.1-1.63 1.14-.42.04-.95.06-1.53-.1-.35-.11-.8-.26-1.38-.52-2.42-1.04-4-3.47-4.12-3.64-.12-.16-.99-1.32-.99-2.52 0-1.2.63-1.79.85-2.03Z"
        fillRule="evenodd"
      />
    </SvgIcon>
  );
}
