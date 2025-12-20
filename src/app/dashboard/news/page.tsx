"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Globe,
  MapPin,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from "lucide-react";

type NewsItem = {
  title: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  url: string; // Added URL field
};

type NewsData = {
  australia: NewsItem[];
  world: NewsItem[];
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to load news");
      const data = await res.json();
      setNews(data);
    } catch (err) {
      setError("Unable to fetch latest news at this time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Real-time financial trends curated by AI.
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 rounded-md transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {loading && !news ? (
        <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Scanning global markets...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Australian News Column */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Australia</h2>
            </div>

            <div className="grid gap-4">
              {news?.australia?.map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
            </div>
          </section>

          {/* World News Column */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <Globe className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Worldwide</h2>
            </div>

            <div className="grid gap-4">
              {news?.world?.map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "negative":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBorderColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "border-l-green-500";
      case "negative":
        return "border-l-red-500";
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <div
      className={`bg-card border border-border rounded-r-lg border-l-4 ${getBorderColor(item.sentiment)} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground leading-tight hover:text-primary hover:underline group flex gap-2 items-start"
        >
          {item.title}
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
        </a>
        <div className="shrink-0 pt-1" title={`Sentiment: ${item.sentiment}`}>
          {getSentimentIcon(item.sentiment)}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {item.summary}
      </p>
    </div>
  );
}
