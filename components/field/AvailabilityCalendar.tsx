// components/field/AvailabilityCalendar.tsx

import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Field, FieldAvailability } from "@/store/fieldStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface AvailabilityCalendarProps {
  field: Field;
  onTimeSelected?: (date: Date, timeSlot: string) => void;
}

const daysOfWeek = [
  { id: "monday", name: "Lunes" },
  { id: "tuesday", name: "Martes" },
  { id: "wednesday", name: "Miércoles" },
  { id: "thursday", name: "Jueves" },
  { id: "friday", name: "Viernes" },
  { id: "saturday", name: "Sábado" },
  { id: "sunday", name: "Domingo" },
];

// Obtener los próximos 7 días a partir de hoy
const getNextSevenDays = () => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    const dayName =
      daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1].name;
    const formattedDate = date.getDate().toString();
    const month = date.toLocaleString("es-ES", { month: "short" });

    days.push({
      date,
      dayName: i === 0 ? "Hoy" : dayName,
      day: formattedDate,
      month,
      dayOfWeek:
        date.getDay() === 0 ? "sunday" : daysOfWeek[date.getDay() - 1].id,
    });
  }

  return days;
};

// Horarios típicos para mostrar (si no hay disponibilidad específica)
const defaultTimeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

export function AvailabilityCalendar({
  field,
  onTimeSelected,
}: AvailabilityCalendarProps) {
  const colorScheme = useColorScheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(
    daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].id
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const nextSevenDays = getNextSevenDays();

  // Actualizar slots disponibles cuando cambia el día seleccionado
  useEffect(() => {
    if (field.availability && field.availability.length > 0) {
      // Buscar disponibilidad para el día seleccionado
      const dayAvailability = field.availability.find(
        (item) => item.day.toLowerCase() === selectedDay
      );

      if (dayAvailability && dayAvailability.times.length > 0) {
        setAvailableSlots(dayAvailability.times);
      } else {
        // Si no hay disponibilidad específica, usar horarios por defecto
        setAvailableSlots(defaultTimeSlots);
      }
    } else {
      setAvailableSlots(defaultTimeSlots);
    }

    // Resetear el tiempo seleccionado al cambiar de día
    setSelectedTime(null);
  }, [selectedDay, field]);

  // Manejar selección de día
  const handleDaySelect = (day: any) => {
    setSelectedDate(day.date);
    setSelectedDay(day.dayOfWeek);
  };

  // Manejar selección de horario
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);

    if (onTimeSelected) {
      // Crear una nueva fecha con la hora seleccionada
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = time.split(":").map(Number);
      dateTime.setHours(hours, minutes);

      onTimeSelected(dateTime, time);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Disponibilidad
      </ThemedText>

      {/* Selector de días */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {nextSevenDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayItem,
              selectedDay === day.dayOfWeek && styles.selectedDayItem,
              selectedDay === day.dayOfWeek && {
                backgroundColor: Colors[colorScheme].primary + "20",
                borderColor: Colors[colorScheme].primary,
              },
            ]}
            onPress={() => handleDaySelect(day)}
          >
            <ThemedText
              type="caption"
              style={[
                selectedDay === day.dayOfWeek && {
                  color: Colors[colorScheme].primary,
                  fontWeight: "600",
                },
              ]}
            >
              {day.dayName}
            </ThemedText>
            <ThemedText
              type="body"
              weight="semiBold"
              style={[
                styles.dayNumber,
                selectedDay === day.dayOfWeek && {
                  color: Colors[colorScheme].primary,
                },
              ]}
            >
              {day.day}
            </ThemedText>
            <ThemedText
              type="caption"
              style={[
                styles.monthText,
                selectedDay === day.dayOfWeek && {
                  color: Colors[colorScheme].primary,
                },
              ]}
            >
              {day.month}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Horarios disponibles */}
      <ThemedText type="body" weight="semiBold" style={styles.timeSlotsTitle}>
        Horarios disponibles
      </ThemedText>

      <View style={styles.timeSlotsContainer}>
        {availableSlots.length > 0 ? (
          <View style={styles.timeGrid}>
            {availableSlots.map((time, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                  selectedTime === time && {
                    backgroundColor: Colors[colorScheme].primary,
                  },
                ]}
                onPress={() => handleTimeSelect(time)}
              >
                <ThemedText
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.selectedTimeText,
                  ]}
                >
                  {time}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ThemedText type="body" secondary style={styles.noTimesText}>
            No hay horarios disponibles para este día
          </ThemedText>
        )}
      </View>

      <ThemedText type="caption" secondary style={styles.disclaimerText}>
        * Los horarios están sujetos a disponibilidad y pueden cambiar.
        Recomendamos confirmar directamente con la cancha.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.m,
  },
  title: {
    marginBottom: Spacing.m,
  },
  daysContainer: {
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.m,
  },
  dayItem: {
    width: 70,
    height: 90,
    borderRadius: Shape.radius.m,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: Spacing.s,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
  },
  selectedDayItem: {
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 24,
    marginVertical: Spacing.xs,
  },
  monthText: {
    textTransform: "capitalize",
  },
  timeSlotsTitle: {
    marginBottom: Spacing.s,
  },
  timeSlotsContainer: {
    marginBottom: Spacing.m,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  timeSlot: {
    width: "30%",
    borderRadius: Shape.radius.m,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: Spacing.s,
    marginRight: "3%",
    marginBottom: Spacing.s,
    alignItems: "center",
  },
  selectedTimeSlot: {
    borderWidth: 0,
  },
  timeText: {
    fontSize: 14,
  },
  selectedTimeText: {
    color: "white",
    fontWeight: "600",
  },
  noTimesText: {
    textAlign: "center",
    marginVertical: Spacing.m,
  },
  disclaimerText: {
    marginTop: Spacing.s,
    fontStyle: "italic",
  },
});
