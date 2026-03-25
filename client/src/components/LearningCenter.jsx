import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Book,
  Award,
  TrendingUp,
  PlayCircle,
  CheckCircle,
  Target,
  ArrowLeft,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "./ui/Toast";

const LearningCenter = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [techniques, setTechniques] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchTechniques();
    fetchLearningPath();
  }, []);

  const fetchTechniques = async () => {
    try {
      const response = await api.get("/learning/techniques");
      setTechniques(response.data);
    } catch (error) {
      console.error("Error fetching techniques:", error);
    }
  };

  const fetchLearningPath = async () => {
    try {
      const response = await api.get("/learning/path");
      setLearningPath(response.data);
    } catch (error) {
      console.error("Error fetching learning path:", error);
    }
  };

  const completeTechnique = async (techniqueId, techniqueName) => {
    try {
      await api.post("/learning/path/complete-technique", {
        techniqueId,
        techniqueName,
      });
      fetchLearningPath();
      addToast(`✅ Technique "${techniqueName}" marked as practiced!`);
    } catch (error) {
      console.error("Error completing technique:", error);
    }
  };

  const categories = [
    "all",
    "knife-skills",
    "cooking-methods",
    "baking",
    "prep",
    "plating",
    "sauce-making",
    "seasoning",
  ];

  const filteredTechniques =
    filterCategory === "all"
      ? techniques
      : techniques.filter((t) => t.category === filterCategory);

  const completedTechniques = learningPath?.techniquesCompleted || [];

  return (
    <div className="min-h-screen bg-gradient-mesh pt-14">
      <header className="glass sticky top-14 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" /> Learning Center
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {learningPath && (
          <div className="card p-5 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Your Progress
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {learningPath.currentLevel.toUpperCase()}
                </div>
                <div className="text-gray-700">Current Level</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {completedTechniques.length}
                </div>
                <div className="text-gray-700">Techniques Mastered</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {learningPath.certifications?.length || 0}
                </div>
                <div className="text-gray-700">Certifications Earned</div>
              </div>
            </div>

            {learningPath.certifications?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Your Certifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  {learningPath.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-lg shadow"
                    >
                      🏆 {cert.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card p-5 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Browse Techniques
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterCategory === cat
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cat.replace("-", " ").toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredTechniques.map((technique) => {
              const isCompleted = completedTechniques.some(
                (ct) =>
                  ct.techniqueId?.toString() === technique._id?.toString(),
              );
              const masteryData = completedTechniques.find(
                (ct) =>
                  ct.techniqueId?.toString() === technique._id?.toString(),
              );

              return (
                <div
                  key={technique._id}
                  className={`border-2 rounded-lg p-4 transition cursor-pointer ${
                    isCompleted
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 bg-white hover:border-purple-400"
                  }`}
                  onClick={() => setSelectedTechnique(technique)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">
                      {technique.name}
                    </h3>
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    {technique.description}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-gray-200 px-2 py-1 rounded">
                      {technique.category}
                    </span>
                    <span className="bg-gray-200 px-2 py-1 rounded">
                      {technique.difficulty}
                    </span>
                  </div>

                  {masteryData && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-1">
                        Mastery: {masteryData.masteryLevel}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${masteryData.masteryLevel}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Practiced {masteryData.timesPerformed} times
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      completeTechnique(technique._id, technique.name);
                    }}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                  >
                    {isCompleted ? "Practice Again" : "Mark as Practiced"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {selectedTechnique && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
              {selectedTechnique.name}
            </h2>

            <div className="mb-4">
              <div className="text-gray-700 mb-2">
                {selectedTechnique.description}
              </div>
              <div className="flex gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {selectedTechnique.category}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {selectedTechnique.difficulty}
                </span>
              </div>
            </div>

            {selectedTechnique.steps?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 mb-2">Steps:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {selectedTechnique.steps.map((step, idx) => (
                    <li key={idx} className="text-gray-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {selectedTechnique.commonMistakes?.length > 0 && (
              <div className="mb-4 bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold text-red-800 mb-2">
                  ⚠️ Common Mistakes:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedTechnique.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="text-red-700 text-sm">
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTechnique.proTips?.length > 0 && (
              <div className="mb-4 bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">💡 Pro Tips:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedTechnique.proTips.map((tip, idx) => (
                    <li key={idx} className="text-green-700 text-sm">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setSelectedTechnique(null)}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningCenter;
