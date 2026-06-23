"use client";

import { useEffect, useState } from "react";
import { Boxes, AlertTriangle, Search } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  unit: string;
  minStockLevel: number;
  totalStock: number;
  category?: { name: string };
}

export default function StockPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/medicines")
      .then(r => r.json())
      .then(data => { setMedicines(data); setLoading(false); });
  }, []);

  const filtered = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "low") return matchSearch && m.totalStock <= m.minStockLevel;
    if (filter === "out") return matchSearch && m.totalStock === 0;
    return matchSearch;
  });

  const lowCount = medicines.filter(m => m.totalStock <= m.minStockLevel && m.totalStock > 0).length;
  const outCount = medicines.filter(m => m.totalStock === 0).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Нөөцийн хяналт</h1>
        <p className="text-sm text-gray-500">Эмийн нөөцийн байдал</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <p className="text-sm text-gray-500">Нийт эм</p>
          <p className="text-2xl font-bold text-gray-900">{medicines.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50">
          <p className="text-sm text-orange-600">Дутагдалтай</p>
          <p className="text-2xl font-bold text-orange-600">{lowCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">Дууссан</p>
          <p className="text-2xl font-bold text-red-600">{outCount}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Эм хайх..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
        >
          <option value="all">Бүгд</option>
          <option value="low">Дутагдалтай</option>
          <option value="out">Дууссан</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Уншиж байна...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Эмийн нэр</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Ангилал</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Нөөц</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Доод хэмжээ</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const isOut = m.totalStock === 0;
                const isLow = m.totalStock <= m.minStockLevel && m.totalStock > 0;
                return (
                  <tr key={m.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      <span style={{ color: isOut ? "#dc2626" : isLow ? "#ea580c" : "#16a34a" }}>
                        {m.totalStock} {m.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{m.minStockLevel}</td>
                    <td className="px-4 py-3 text-center">
                      {isOut ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Дууссан</span>
                      ) : isLow ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600 flex items-center gap-1 justify-center">
                          <AlertTriangle className="size-3" /> Дутагдалтай
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">Хэвийн</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Boxes className="size-10 mx-auto mb-2 opacity-30" />
              <p>Мэдээлэл байхгүй</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
