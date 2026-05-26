export default function Footer() {
  const ano = new Date().getFullYear();
  
  return (
    <footer className="relative z-10 text-center py-8 text-gray-500 text-sm border-t border-white/10 mt-auto">
      <p className="mb-1">
        Desenvolvido por <span className="text-yellow-500 font-semibold">Elton Luis</span>
      </p>
      <p className="text-xs text-gray-600">
        © {ano} Estrategista da Copa - Todos os direitos reservados
      </p>
    </footer>
  );
}