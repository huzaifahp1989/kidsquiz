'use client';

import React, { useState } from 'react';
import { Button, Modal } from '@/components';
import { TrashIcon, PlusIcon } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  points: number;
}

interface Surah {
  id: string;
  number: number;
  englishName: string;
}

interface Hadith {
  id: string;
  english: string;
  topic: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'questions' | 'surahs' | 'hadiths' | 'system'>('questions');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample data
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', question: 'How many pillars are there?', category: 'Quran', difficulty: 'Easy', points: 10 },
    { id: '2', question: 'What is Hajj?', category: 'Quran', difficulty: 'Medium', points: 15 },
  ]);

  const [surahs, setSurahs] = useState<Surah[]>([
    { id: '1', number: 36, englishName: 'Yaseen' },
    { id: '2', number: 18, englishName: 'Al-Kahf' },
  ]);

  const [hadiths, setHadiths] = useState<Hadith[]>([
    { id: '1', english: 'The best among you are those who are best to their families...', topic: 'Manners' },
  ]);

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleDeleteSurah = (id: string) => {
    setSurahs(surahs.filter(s => s.id !== id));
  };

  const handleDeleteHadith = (id: string) => {
    setHadiths(hadiths.filter(h => h.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-8 rounded-2xl mb-8">
          <h1 className="text-4xl font-bold mb-2">🔐 Admin Panel</h1>
          <p className="text-lg opacity-90">Manage content, questions, and system settings</p>
          <p className="text-sm mt-4 opacity-75">⚠️ Admin access only - Do not share this page</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['questions', 'surahs', 'hadiths', 'system'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-bold text-lg transition ${
                activeTab === tab
                  ? 'bg-islamic-blue text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'questions' && '📝 Questions'}
              {tab === 'surahs' && '📖 Surahs'}
              {tab === 'hadiths' && '📜 Hadiths'}
              {tab === 'system' && '⚙️ System'}
            </button>
          ))}
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-islamic-dark">Quiz Questions</h2>
              <Button onClick={() => setShowAddModal(true)} variant="success" size="lg">
                <PlusIcon className="inline mr-2" size={20} /> Add Question
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-islamic-blue text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Question</th>
                      <th className="px-6 py-4 text-left">Category</th>
                      <th className="px-6 py-4 text-left">Difficulty</th>
                      <th className="px-6 py-4 text-left">Points</th>
                      <th className="px-6 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{q.question.substring(0, 30)}...</td>
                        <td className="px-6 py-4">{q.category}</td>
                        <td className="px-6 py-4">{q.difficulty}</td>
                        <td className="px-6 py-4">{q.points}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-islamic-blue">{questions.length}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Easy Questions</p>
                <p className="text-3xl font-bold text-green-700">
                  {questions.filter(q => q.difficulty === 'Easy').length}
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Hard Questions</p>
                <p className="text-3xl font-bold text-purple-700">
                  {questions.filter(q => q.difficulty === 'Hard').length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Surahs Tab */}
        {activeTab === 'surahs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-islamic-dark">Quranic Surahs</h2>
              <Button onClick={() => setShowAddModal(true)} variant="success" size="lg">
                <PlusIcon className="inline mr-2" size={20} /> Add Surah
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-islamic-green text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Surah Number</th>
                      <th className="px-6 py-4 text-left">English Name</th>
                      <th className="px-6 py-4 text-left">Arabic Name</th>
                      <th className="px-6 py-4 text-left">Verses</th>
                      <th className="px-6 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surahs.map(s => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{s.number}</td>
                        <td className="px-6 py-4">{s.englishName}</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteSurah(s.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
              <h3 className="font-bold text-islamic-blue mb-2">📊 Statistics</h3>
              <p className="text-gray-700">Total Surahs: {surahs.length}</p>
            </div>
          </div>
        )}

        {/* Hadiths Tab */}
        {activeTab === 'hadiths' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-islamic-dark">Hadith Collection</h2>
              <Button onClick={() => setShowAddModal(true)} variant="success" size="lg">
                <PlusIcon className="inline mr-2" size={20} /> Add Hadith
              </Button>
            </div>

            <div className="grid gap-4">
              {hadiths.map(h => (
                <div key={h.id} className="bg-white p-6 rounded-lg border-2 border-gray-300 hover:border-islamic-green">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-islamic-dark mb-2">{h.english.substring(0, 60)}...</p>
                      <p className="text-sm text-gray-600">Topic: {h.topic}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHadith(h.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-islamic-dark">System Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border-l-4 border-islamic-gold p-6 rounded-lg">
                <h3 className="font-bold text-yellow-700 mb-4">🔄 Reset Functions</h3>
                <div className="space-y-3">
                  <Button variant="warning" className="w-full">
                    🏆 Reset Weekly Leaderboard
                  </Button>
                  <Button variant="warning" className="w-full">
                    📅 Reset Monthly Leaderboard
                  </Button>
                  <Button variant="danger" className="w-full">
                    ⚠️ Reset All User Points
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-islamic-blue p-6 rounded-lg">
                <h3 className="font-bold text-islamic-blue mb-4">📊 System Statistics</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Total Users:</strong> 1,234</p>
                  <p><strong>Active Today:</strong> 342</p>
                  <p><strong>Questions Answered:</strong> 15,678</p>
                  <p><strong>Quizzes Completed:</strong> 4,523</p>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-islamic-green p-6 rounded-lg">
                <h3 className="font-bold text-islamic-green mb-4">🛠️ Database</h3>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full">
                    💾 Backup Database
                  </Button>
                  <Button variant="secondary" className="w-full">
                    📥 Import Data
                  </Button>
                </div>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
                <h3 className="font-bold text-purple-700 mb-4">⚙️ Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-gray-700">Enable/Disable Registrations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-gray-700">Maintenance Mode</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg">
              <h3 className="font-bold text-red-700 mb-3">⚠️ Danger Zone</h3>
              <p className="text-gray-700 mb-4 text-sm">These actions cannot be undone!</p>
              <Button variant="danger" className="w-full">
                🗑️ Delete All User Data (Irreversible)
              </Button>
            </div>
          </div>
        )}

        {/* Add Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={
            activeTab === 'questions'
              ? 'Add New Question'
              : activeTab === 'surahs'
              ? 'Add New Surah'
              : 'Add New Hadith'
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Enter Details</label>
              <textarea
                className="w-full border-2 border-gray-300 rounded-lg p-3 h-24 focus:border-islamic-blue"
                placeholder="Enter content here..."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="success" className="flex-1">
                ✓ Add
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
