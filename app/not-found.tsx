import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="panel-label">404</p>
      <h1>Калькулятор не знайдено.</h1>
      <p>Перевір адресу або повернись до каталогу, щоб обрати інший розрахунок.</p>
      <Link className="cta-link" href="/">
        До каталогу
      </Link>
    </main>
  );
}
