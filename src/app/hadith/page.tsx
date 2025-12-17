'use client';

import React, { useState } from 'react';
import { hadithsList } from '@/data/hadith';
import { Button } from '@/components';

export default function HadithPage() {
  const [selectedHadith, setSelectedHadith] = useState(hadithsList[0]);
  const [filter, setFilter] = useState<'All' | 'Kindness' | 'Honesty' | 'Parents' | 'Salah' | 'Manners'>('All');

  const filteredHadiths = filter === 'All'
    ? hadithsList
    : hadithsList.filter(h => h.topic === filter);

  const topics = ['All', 'Kindness', 'Honesty', 'Parents', 'Salah', 'Manners'] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2 islamic-shadow">
            📜 Learn Hadith
          </h1>
          <p className="text-lg text-gray-600">
            Discover authentic Hadith with practical examples for kids!
          </p>
        </div>

        {/* Topic Filter */}
        <div className="mb-8">
          <p className="font-semibold text-islamic-dark mb-4">Filter by Topic:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setFilter(topic)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === topic
                    ? 'bg-islamic-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Hadith List */}
        <div className="grid gap-4 mb-8">
          {filteredHadiths.map(hadith => (
            <button
              key={hadith.id}
              onClick={() => setSelectedHadith(hadith)}
              className={`text-left p-4 border-2 rounded-lg transition ${
                selectedHadith.id === hadith.id
                  ? 'border-islamic-blue bg-blue-50'
                  : 'border-gray-300 hover:border-islamic-blue'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-islamic-dark mb-1">
                    {hadith.topic === 'Kindness' && '❤️'}
                    {hadith.topic === 'Honesty' && '✅'}
                    {hadith.topic === 'Parents' && '👨‍👩‍👧'}
                    {hadith.topic === 'Salah' && '🤲'}
                    {hadith.topic === 'Manners' && '🙏'}
                    {' '}{hadith.english.substring(0, 60)}...
                  </p>
                  <p className="text-sm text-gray-600">Source: {hadith.source}</p>
                </div>
                <span className="text-2xl flex-shrink-0">{hadith.topic}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Hadith Details */}
        {selectedHadith && (
          <div className="space-y-6">
            {/* Hadith Header */}
            <div className="bg-gradient-to-r from-islamic-green to-islamic-blue text-white p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">{selectedHadith.topic}</h2>
              <p className="text-lg leading-relaxed italic">
                "{selectedHadith.english}"
              </p>
              <p className="text-sm mt-4 opacity-90">Source: {selectedHadith.source}</p>
            </div>

            {/* Meaning */}
            <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
              <h3 className="font-bold text-islamic-blue mb-3 text-lg">📖 What it Means</h3>
              <p className="text-base leading-relaxed text-gray-800">
                {selectedHadith.meaning}
              </p>
            </div>

            {/* Practical Example */}
            <div className="bg-yellow-50 border-l-4 border-islamic-gold p-6 rounded-lg">
              <h3 className="font-bold text-yellow-700 mb-3 text-lg">💡 How You Can Do This</h3>
              <p className="text-base leading-relaxed text-gray-800">
                {selectedHadith.practicalExample}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button variant="success" size="lg" className="flex-1">
                ✓ I Will Do This!
              </Button>
              <Button variant="primary" size="lg" className="flex-1">
                📝 Quiz on This
              </Button>
            </div>

            {/* Educational Note */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
              <h4 className="font-bold text-purple-700 mb-2">🎓 Remember</h4>
              <p className="text-gray-700">
                This Hadith comes from authentic Islamic sources. When we follow these teachings,
                we are following the example of Prophet Muhammad (peace be upon him) and becoming
                better Muslims. Try to practice this Hadith in your daily life! 🌟
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
