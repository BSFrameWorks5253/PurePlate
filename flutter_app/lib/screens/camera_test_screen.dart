import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/food_protocol.dart';
import '../models/test_incident.dart';
import '../services/app_state.dart';

class CameraTestScreen extends StatefulWidget {
  final FoodProtocol protocol;

  const CameraTestScreen({super.key, required this.protocol});

  @override
  State<CameraTestScreen> createState() => _CameraTestScreenState();
}

class _CameraTestScreenState extends State<CameraTestScreen> {
  int _currentStep = 2; // Step 2: Camera verification
  String? _selectedResult; // 'pure' or 'adulterated'
  bool _isAnalyzing = false;
  bool _isFinished = false;
  String _vendorType = 'Local Loose Milk Vendor';

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.protocol.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Step Progress Indicator (from WhatsApp Blueprint)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildStepCircle('1', true),
                _buildStepDivider(true),
                _buildStepCircle('2', _currentStep >= 2),
                _buildStepDivider(_currentStep >= 3),
                _buildStepCircle('3', _currentStep >= 3),
              ],
            ),
            const SizedBox(height: 16),

            // Step Instruction Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
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
                          color: const Color(0xFFCCFBF1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'Step $_currentStep of 3',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F766E),
                          ),
                        ),
                      ),
                      const Text(
                        'Live Scanner Ready',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.protocol.steps[1],
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Camera Viewport Simulation Card with Circular Reticle
            Container(
              height: 280,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Sample Simulation
                  Container(
                    width: 170,
                    height: 170,
                    decoration: BoxDecoration(
                      color: _selectedResult == 'adulterated'
                          ? const Color(0xFF1E1B4B)
                          : const Color(0xFFFAF8F5),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: _selectedResult == 'adulterated'
                              ? const Color(0xFF4338CA).withOpacity(0.5)
                              : Colors.white.withOpacity(0.3),
                          blurRadius: 20,
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      _selectedResult == 'adulterated' ? '🧪 Violet Complex' : '🥛 Liquid Sample',
                      style: TextStyle(
                        color: _selectedResult == 'adulterated' ? Colors.white70 : Colors.black45,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),

                  // Circular Targeting Ring (from Docs Screen 3 Blueprint)
                  Container(
                    width: 190,
                    height: 190,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _selectedResult != null
                            ? const Color(0xFF10B981)
                            : Colors.white.withOpacity(0.7),
                        width: 2,
                        style: BorderStyle.solid,
                      ),
                    ),
                  ),

                  // Overlay prompt
                  Positioned(
                    bottom: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'ALIGN SAMPLE IN RETICLE',
                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Phase 3: Visual Choice Dialogue (from WhatsApp Screenshots)
            if (!_isFinished) ...[
              const Text(
                'What visual change do you observe?',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              const SizedBox(height: 4),
              const Text(
                'Select color match to verify adulteration presence:',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 12),

              // Button A: Pure
              InkWell(
                onTap: () {
                  setState(() {
                    _selectedResult = 'pure';
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _selectedResult == 'pure' ? const Color(0xFFF0FDFA) : Colors.white,
                    border: Border.all(
                      color: _selectedResult == 'pure'
                          ? const Color(0xFF0D9488)
                          : const Color(0xFFE2E8F0),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAF8F5),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.protocol.pureTitle,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              widget.protocol.pureDesc,
                              style: const TextStyle(color: Colors.grey, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      if (_selectedResult == 'pure')
                        const Icon(Icons.check_circle, color: Color(0xFF0D9488)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Button B: Adulterated
              InkWell(
                onTap: () {
                  setState(() {
                    _selectedResult = 'adulterated';
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _selectedResult == 'adulterated' ? const Color(0xFFFFF1F2) : Colors.white,
                    border: Border.all(
                      color: _selectedResult == 'adulterated'
                          ? const Color(0xFFE11D48)
                          : const Color(0xFFE2E8F0),
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E1B4B),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF4338CA)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.protocol.adulteratedTitle,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              widget.protocol.adulteratedDesc,
                              style: const TextStyle(color: Colors.grey, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      if (_selectedResult == 'adulterated')
                        const Icon(Icons.warning, color: Color(0xFFE11D48)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Analyze & Generate Log Button
              ElevatedButton(
                onPressed: _selectedResult == null || _isAnalyzing
                    ? null
                    : () async {
                        setState(() {
                          _isAnalyzing = true;
                        });
                        await Future.delayed(const Duration(milliseconds: 600));
                        setState(() {
                          _isAnalyzing = false;
                          _isFinished = true;
                          _currentStep = 3;
                        });
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0D9488),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isAnalyzing
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'Analyze & Generate Log',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
              ),
            ],

            // Phase 4: Final Verdict & Submission Card
            if (_isFinished) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _selectedResult == 'adulterated'
                        ? const Color(0xFFFECDD3)
                        : const Color(0xFFA7F3D0),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _selectedResult == 'adulterated'
                            ? const Color(0xFFFFF1F2)
                            : const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Text(
                            _selectedResult == 'adulterated' ? '🚨' : '🛡️',
                            style: const TextStyle(fontSize: 28),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _selectedResult == 'adulterated'
                                      ? 'Result: Adulterated. Starch detected!'
                                      : 'Result: Pure. No starch detected.',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                    color: _selectedResult == 'adulterated'
                                        ? const Color(0xFFE11D48)
                                        : const Color(0xFF047857),
                                  ),
                                ),
                                Text(
                                  _selectedResult == 'adulterated'
                                      ? 'Target: ${widget.protocol.adulterant}'
                                      : 'Sample certified safe under home protocol.',
                                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (_selectedResult == 'adulterated') ...[
                      DropdownButtonFormField<String>(
                        value: _vendorType,
                        items: const [
                          DropdownMenuItem(
                            value: 'Local Loose Milk Vendor',
                            child: Text('Local Loose Milk Vendor / Dairy', style: TextStyle(fontSize: 12)),
                          ),
                          DropdownMenuItem(
                            value: 'Supermarket Brand Packet',
                            child: Text('Supermarket Brand Packet', style: TextStyle(fontSize: 12)),
                          ),
                          DropdownMenuItem(
                            value: 'Local Market Bazaar',
                            child: Text('Local Market Bazaar', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _vendorType = val);
                        },
                        decoration: InputDecoration(
                          labelText: 'Sample Source',
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Submit to Map Button (Phase 4 Block Logic)
                      ElevatedButton.icon(
                        onPressed: () {
                          final incident = TestIncident(
                            id: 'inc_${DateTime.now().millisecondsSinceEpoch}',
                            lat: 21.1738,
                            lng: 72.8028,
                            neighborhood: appState.userRegion,
                            food: widget.protocol.foodName,
                            testType: widget.protocol.title,
                            status: 'fail',
                            adulterant: widget.protocol.adulterant,
                            vendorType: _vendorType,
                            timestamp: 'Just now',
                            date: DateTime.now(),
                          );
                          appState.addIncident(incident);

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Data successfully submitted to the PurePlate Community Network. Thank you for protecting your neighborhood!',
                              ),
                              backgroundColor: Color(0xFF0D9488),
                            ),
                          );
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.cloud_upload),
                        label: const Text('Submit to PurePlate Community Network'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE11D48),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ] else ...[
                      // Close Test Button (for Pure samples)
                      ElevatedButton(
                        onPressed: () {
                          appState.addPoints(50);
                          appState.unlockBadge('milk_master');
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Save Result & Return to Dashboard'),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStepCircle(String text, bool active) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: active ? const Color(0xFF0D9488) : const Color(0xFFE2E8F0),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        text,
        style: TextStyle(
          color: active ? Colors.white : Colors.grey,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildStepDivider(bool active) {
    return Container(
      width: 24,
      height: 2,
      color: active ? const Color(0xFF0D9488) : const Color(0xFFE2E8F0),
    );
  }
}
