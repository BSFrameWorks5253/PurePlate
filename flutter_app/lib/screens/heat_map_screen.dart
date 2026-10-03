import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_state.dart';

class HeatMapScreen extends StatefulWidget {
  const HeatMapScreen({super.key});

  @override
  State<HeatMapScreen> createState() => _HeatMapScreenState();
}

class _HeatMapScreenState extends State<HeatMapScreen> {
  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final incidents = appState.incidents.where((i) {
      if (_selectedFilter == 'fail') return i.status == 'fail';
      if (_selectedFilter == 'pass') return i.status == 'pass';
      if (_selectedFilter == 'milk') return i.food.toLowerCase().contains('milk');
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Regional Food Security Tracker',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location, color: Color(0xFF0D9488)),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Centered on Surat GPS coordinates.')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('All Food Types', 'all'),
                _buildFilterChip('⚠️ Contamination Spikes', 'fail'),
                _buildFilterChip('🛡️ Pure Zones', 'pass'),
                _buildFilterChip('🥛 Milk Only', 'milk'),
              ],
            ),
          ),

          // Map View Visual Representation (Simulated / OpenStreetMap integration)
          Container(
            height: 260,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: Stack(
              children: [
                // Base map vector grid
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    color: const Color(0xFFE0F2FE),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.map, size: 48, color: Color(0xFF93C5FD)),
                          const SizedBox(height: 6),
                          Text(
                            'Surat Metropolitan Heat Grid (${incidents.length} active points)',
                            style: const TextStyle(color: Color(0xFF1E3A8A), fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const Text(
                            'Athwa • Adajan • Pal • Varachha • Majura Gate',
                            style: TextStyle(color: Color(0xFF3B82F6), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Pulsing Red Radar Indicator for Athwa spike
                Positioned(
                  top: 50,
                  left: 80,
                  child: _buildRadarPin('Athwa Lines (4 Fails)', Colors.red),
                ),

                // Green shield for Pal pure zone
                Positioned(
                  bottom: 70,
                  right: 90,
                  child: _buildRadarPin('Pal Verified (Pure)', Colors.green),
                ),

                // Map Legend
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('🔴 Spikes (>3 fails)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        Text('🟢 Safe zone', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Pull-up Feed Header (from WhatsApp Blueprint Screen 4)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Community Public Logs',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  '${incidents.length} logs',
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Detailed Feed List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: incidents.length,
              itemBuilder: (context, index) {
                final item = incidents[index];
                final isFail = item.status == 'fail';

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Text(isFail ? '⚠️' : '✅', style: const TextStyle(fontSize: 20)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isFail
                                  ? '${item.timestamp}: Adulterated ${item.food} near ${item.neighborhood}.'
                                  : '${item.timestamp}: Pure ${item.food} verified near ${item.neighborhood}.',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: isFail ? const Color(0xFF9F1239) : const Color(0xFF065F46),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Type: ${item.testType} • Source: ${item.vendorType}',
                              style: const TextStyle(color: Colors.grey, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String key) {
    final isSelected = _selectedFilter == key;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) {
          setState(() {
            _selectedFilter = key;
          });
        },
        selectedColor: const Color(0xFF0F172A),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.black87,
          fontWeight: FontWeight.bold,
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildRadarPin(String label, Color color) {
    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(color: color.withOpacity(0.5), blurRadius: 10, spreadRadius: 4),
            ],
          ),
          child: Icon(
            color == Colors.red ? Icons.warning : Icons.shield,
            size: 12,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.7),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
