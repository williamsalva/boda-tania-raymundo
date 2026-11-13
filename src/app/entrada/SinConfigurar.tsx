export function SinConfigurar() {
  return (
    <div className="pt-20">
      <div className="rounded-3xl bg-amber-400/10 p-6 text-amber-100 ring-1 ring-amber-400/30">
        <h1 className="text-lg font-semibold text-amber-200">Falta configurar el PIN</h1>
        <p className="mt-1">
          Agrega la variable <code className="num">ENTRADA_PIN</code> en Vercel y vuelve a desplegar para abrir la app de la entrada.
        </p>
      </div>
    </div>
  );
}
