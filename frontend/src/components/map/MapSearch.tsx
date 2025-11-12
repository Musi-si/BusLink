import React, { useState, useEffect } from 'react';

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  onSelect: (lat: number, lon: number, name: string) => void;
};

export const MapSearch: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=0&limit=5`;
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } });
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data || []);
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchResults, 300);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  return (
    <div className="w-80 p-2 bg-white rounded shadow z-[9999]">
      <input
        className="w-full border rounded px-2 py-1"
        placeholder="Search place or address..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <div className="text-sm text-gray-500 mt-1">Searching...</div>}

      {suggestions.length > 0 && (
        <ul className="mt-1 max-h-40 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => onSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MapSearch;
