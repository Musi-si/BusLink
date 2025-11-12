import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=0&limit=6`;
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } });
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data || []);
        setOpen(true);
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchResults, 250);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  const handleSelect = (s: Suggestion) => {
    setQuery(s.display_name);
    setOpen(false);
    setSuggestions([]);
    onSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
  };

  return (
    <div ref={wrapperRef} className="w-96 z-[9999]">
      <Card className="p-2">
        <div className="flex items-center gap-2">
          <Search className="text-muted-foreground" />
          <Input
            className="!h-9"
            placeholder="Search place or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          />
          <Button size="sm" variant="ghost" onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); }}>
            Clear
          </Button>
        </div>

        {open && suggestions.length > 0 && (
          <ul className="mt-2 max-h-56 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <li key={idx} className="p-2 hover:bg-accent/40 rounded cursor-pointer" onClick={() => handleSelect(s)}>
                <div className="text-sm font-medium">{s.display_name}</div>
              </li>
            ))}
          </ul>
        )}

        {open && !loading && suggestions.length === 0 && (
          <div className="mt-2 text-sm text-muted-foreground">No results</div>
        )}
      </Card>
    </div>
  );
};

export default MapSearch;
