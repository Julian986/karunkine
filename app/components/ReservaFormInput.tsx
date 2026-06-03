"use client";

export const iconPerson = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const iconMail = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export const iconPhone = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

export const iconComment = (
  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
    />
  </svg>
);

export function ReservaFormInput({
  placeholder,
  type = "text",
  icon,
  id,
  name,
  ariaLabel,
  error,
  onBlur,
  value,
  onChange,
  autoComplete,
}: {
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  id: string;
  name?: string;
  ariaLabel: string;
  error?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  autoComplete?: string;
}) {
  const isTextarea = type === "textarea";
  const sharedProps = {
    id,
    name: name ?? id,
    placeholder,
    "aria-label": ariaLabel,
    "aria-invalid": Boolean(error),
    onBlur,
    ...(value !== undefined ? { value } : {}),
    ...(onChange ? { onChange } : {}),
    ...(autoComplete ? { autoComplete } : {}),
  };

  return (
    <div className="relative">
      {isTextarea ? (
        <textarea
          {...sharedProps}
          rows={3}
          className={`form-accent-focus w-full resize-none rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 ${error ? "ring-1 ring-red-400" : ""}`}
        />
      ) : (
        <input
          {...sharedProps}
          type={type}
          className={`form-accent-focus w-full rounded-xl bg-zinc-100 py-3 pl-4 pr-11 text-zinc-800 outline-none transition placeholder:text-zinc-400 ${error ? "ring-1 ring-red-400" : ""}`}
        />
      )}
      <span
        className={`pointer-events-none absolute right-3 ${isTextarea ? "top-3" : "top-1/2 -translate-y-1/2"}`}
      >
        {icon}
      </span>
    </div>
  );
}
