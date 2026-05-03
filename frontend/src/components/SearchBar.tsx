// depois dá pra colocar ícone, animação, e tudo mais.

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="Buscar OS por cliente, placa ou telefone..."
        className="w-full border border-gray-300 rounded px-4 py-2 shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
