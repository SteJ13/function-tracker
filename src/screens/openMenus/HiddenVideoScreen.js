import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HiddenVideoScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      clearTimers();
      setIsRecording(false);
      return;
    }

    clearTimers();
    setIsRecording(true);
    setElapsedSec(0);

    // Placeholder state-only timer until native camera capture is integrated.
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const diffSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(diffSec);
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setIsRecording(false);
    }, 1000 * 60 * 5);
  };

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hidden Video</Text>
        <Text style={styles.desc}>
          This is the stealth recording entry point in Open Menus. You can continue using the app while this mode is active.
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, isRecording ? styles.dotOn : styles.dotOff]} />
          <Text style={styles.statusText}>{isRecording ? 'Recording...' : 'Idle'}</Text>
          <Text style={styles.timeText}>{mm}:{ss}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, isRecording ? styles.stopButton : styles.startButton]}
          onPress={toggleRecording}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>{isRecording ? 'Stop' : 'Start Hidden Record'}</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Note: This screen currently provides hidden-mode workflow UI. Native camera recording integration can be added next.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17212B',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#5B6672',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotOn: {
    backgroundColor: '#D32F2F',
  },
  dotOff: {
    backgroundColor: '#90A4AE',
  },
  statusText: {
    fontSize: 14,
    color: '#2B3A48',
    fontWeight: '600',
  },
  timeText: {
    marginLeft: 'auto',
    fontSize: 16,
    fontWeight: '700',
    color: '#17212B',
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#1976D2',
  },
  stopButton: {
    backgroundColor: '#C62828',
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: '#6B7785',
    lineHeight: 18,
  },
});