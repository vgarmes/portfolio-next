"use client";

import { Demo } from "@/components/demo";
import clsx from "clsx";
import { useId, useState, type FormEvent } from "react";
import styles from "./paper-form.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PaperForm: React.FC = () => {
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("That address doesn’t look right.");
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  const reset = () => {
    setName("");
    setEmail("");
    setSubmitted(false);
  };

  return (
    <Demo>
      <div className={styles.sheet}>
        <div className={styles.fingerprint} aria-hidden />

        <header className={clsx(styles.header, styles.ink)}>
          <span>Correspondence</span>
          <span className={styles.folio}>Form Nº 07</span>
        </header>
        <div className={styles.rule} aria-hidden />

        {submitted ? (
          <div aria-live="polite">
            <h3 className={clsx(styles.title, styles.ink)}>Received.</h3>
            <p className={clsx(styles.lede, styles.ink)}>
              Thanks{name ? `, ${name}` : ""}. A reply will be posted to{" "}
              {email}.
            </p>
            <button
              type="button"
              className={clsx(styles.reset, styles.ink)}
              onClick={reset}
            >
              Fill in another
            </button>
          </div>
        ) : (
          <>
            <h3 className={clsx(styles.title, styles.ink)}>Stay in touch</h3>
            <p className={clsx(styles.lede, styles.ink)}>
              Occasional notes on things I’m building. No more than once a
              month.
            </p>

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <label className={styles.field}>
                <span className={styles.ink}>Name</span>
                <input
                  className={clsx(styles.input, styles.ink)}
                  name="name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.ink}>Email</span>
                <input
                  className={clsx(styles.input, styles.ink)}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="ada@example.com"
                  value={email}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </label>

              {error && (
                <p
                  id={`${id}-error`}
                  role="alert"
                  className={clsx(styles.status, styles.ink)}
                >
                  {error}
                </p>
              )}

              <button type="submit" className={styles.submit}>
                <span>Subscribe</span>
              </button>
            </form>
          </>
        )}

        <footer className={clsx(styles.colophon, styles.ink)}>
          <span>Printed matter</span>
          <span>2026</span>
        </footer>
      </div>
    </Demo>
  );
};
