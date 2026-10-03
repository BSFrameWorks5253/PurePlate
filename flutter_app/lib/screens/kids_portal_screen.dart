import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_state.dart';

class KidsPortalScreen extends StatefulWidget {
  const KidsPortalScreen({super.key});

  @override
  State<KidsPortalScreen> createState() => _KidsPortalScreenState();
}

class _KidsPortalScreenState extends State<KidsPortalScreen> {
  int _selectedQuizAnswer = -1;
  bool _quizAnswered = false;

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'School-To-Home Detective Lab',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Student Detective Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  alignment: Alignment.center,
                  child: const Text('🕵️‍♂️', style: TextStyle(fontSize: 28)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Junior Food Inspector',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFACC15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${appState.userPoints} PTS',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black87),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: const LinearProgressIndicator(
                          value: 0.75,
                          minHeight: 6,
                          backgroundColor: Colors.white24,
                          valueColor: AlwaysStoppedAnimation(Color(0xFF38BDF8)),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Level 3 Detective • 80 pts to Level 4',
                        style: TextStyle(color: Color(0xFFA5B4FC), fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Earned Digital Badges (from Docs Module 3)
          const Text(
            'Your Earned Digital Badges',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBadge('🔍', 'Detective', appState.badges.contains('detective')),
              _buildBadge('🥛', 'Milk Master', appState.badges.contains('milk_master')),
              _buildBadge('🌶️', 'Spice Sleuth', appState.badges.contains('spice_sleuth')),
              _buildBadge('🧪', 'Chemist', appState.badges.contains('chemist')),
            ],
          ),
          const SizedBox(height: 20),

          // Daily Science Quiz Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3E8FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Daily Science Quiz',
                        style: TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),
                    const Text('⭐ +50 PTS', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  'What color does milk turn when Iodine is added if starch was mixed in as an adulterant?',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 12),

                ...[
                  'A. Stays Pale White',
                  'B. Deep Blue / Violet',
                  'C. Transparent Clear',
                  'D. Bright Emerald Green'
                ].asMap().entries.map((entry) {
                  final idx = entry.key;
                  final text = entry.value;
                  final isSelected = _selectedQuizAnswer == idx;
                  final isCorrect = idx == 1;

                  Color borderCol = const Color(0xFFE2E8F0);
                  Color bgCol = Colors.white;

                  if (_quizAnswered) {
                    if (isCorrect) {
                      borderCol = const Color(0xFF22C55E);
                      bgCol = const Color(0xFFDCFCE7);
                    } else if (isSelected) {
                      borderCol = const Color(0xFFEF4444);
                      bgCol = const Color(0xFFFEE2E2);
                    }
                  }

                  return InkWell(
                    onTap: _quizAnswered
                        ? null
                        : () {
                            setState(() {
                              _selectedQuizAnswer = idx;
                              _quizAnswered = true;
                            });
                            if (isCorrect) {
                              appState.addPoints(50);
                              appState.unlockBadge('chemist');
                            }
                          },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: bgCol,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderCol),
                      ),
                      child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ),
                  );
                }).toList(),

                if (_quizAnswered) ...[
                  const SizedBox(height: 8),
                  Text(
                    _selectedQuizAnswer == 1
                        ? '🎉 Correct! Iodine forms a charge-transfer complex with starch turning it deep blue.'
                        : '❌ Iodine reacts specifically with starch to form an intense deep blue/violet color.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _selectedQuizAnswer == 1 ? const Color(0xFF166534) : const Color(0xFF991B1B),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          // School Leaderboard (from WhatsApp Module 3 Blueprint)
          const Text(
            '🏆 Surat Schools Leaderboard',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 10),

          _buildLeaderboardRow('🥇 1', 'Delhi Public School, Surat', '482 verified tests', true),
          _buildLeaderboardRow('🥈 2', 'Ryan International School', '391 verified tests', false),
          _buildLeaderboardRow('🥉 3', 'Tapti Valley International', '315 verified tests', false),
        ],
      ),
    );
  }

  Widget _buildBadge(String icon, String label, bool unlocked) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: unlocked ? const Color(0xFFFEF9C3) : Colors.grey[200],
            shape: BoxShape.circle,
            border: Border.all(
              color: unlocked ? const Color(0xFFFACC15) : Colors.grey[300]!,
              width: 2,
            ),
          ),
          alignment: Alignment.center,
          child: Text(icon, style: TextStyle(fontSize: 22, color: unlocked ? null : Colors.grey)),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: unlocked ? Colors.black87 : Colors.grey,
          ),
        ),
        Text(
          unlocked ? 'Unlocked' : 'Locked',
          style: TextStyle(
            fontSize: 9,
            color: unlocked ? const Color(0xFF0D9488) : Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildLeaderboardRow(String rank, String school, String tests, bool isFirst) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isFirst ? const Color(0xFFFEFCE8) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isFirst ? const Color(0xFFFEF08A) : const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Text(rank, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(school, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(tests, style: const TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
          const Text('🛡️ Active', style: TextStyle(color: Color(0xFF047857), fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
