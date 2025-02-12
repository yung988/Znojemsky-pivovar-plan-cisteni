"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Printer, ChevronLeft, ChevronRight, Plus, Edit2, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface Tap {
  id: number
  name: string
}

interface CleaningRecord {
  id: number
  tap_id: number
  date: string
  time: string
  employee: string
  type: string
}

export const CleaningSchedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [cleaningRecords, setCleaningRecords] = useState<CleaningRecord[]>([])
  const [taps, setTaps] = useState<Tap[]>([])
  const [editingTap, setEditingTap] = useState<number | null>(null)
  const [newTapName, setNewTapName] = useState("")
  const [isAddingTap, setIsAddingTap] = useState(false)

  const cleaningTypes = ["Běžné", "Hloubkové", "Sanitace"]

  // Načtení výčepů
  useEffect(() => {
    const fetchTaps = async () => {
      const { data, error } = await supabase.from("taps").select("*").order("id")
      if (error) {
        console.error("Chyba při načítání výčepů:", error)
        return
      }
      setTaps(data)
    }
    fetchTaps()
  }, [])

  // Načtení záznamů čištění pro aktuální týden
  useEffect(() => {
    const fetchCleaningRecords = async () => {
      const weekDays = getWeekDays(selectedDate)
      const startDate = weekDays[0].toISOString().split("T")[0]
      const endDate = weekDays[6].toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("cleaning_records")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)

      if (error) {
        console.error("Chyba při načítání záznamů:", error)
        return
      }
      setCleaningRecords(data)
    }
    fetchCleaningRecords()
  }, [selectedDate])

  const getWeekDays = (date: Date): Date[] => {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay() + 1)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const weekDays = getWeekDays(selectedDate)

  const addCleaningRecord = async (date: Date, tapId: number) => {
    const now = new Date()
    const time = now.toLocaleTimeString('cs-CZ', { hour12: false }).split(' ')[0]
    const { error } = await supabase.from("cleaning_records").insert([
      {
        tap_id: tapId,
        date: date.toISOString().split("T")[0],
        time: time,
        employee: "Jan Novák",
        type: "Běžné",
      },
    ])

    if (error) {
      console.error("Chyba při přidávání záznamu:", error)
      return
    }

    // Aktualizace lokálního stavu
    const { data: newRecord } = await supabase
      .from("cleaning_records")
      .select("*")
      .eq("tap_id", tapId)
      .eq("date", date.toISOString().split("T")[0])
      .single()

    if (newRecord) {
      setCleaningRecords((prev) => [...prev, newRecord])
    }
  }

  const updateCleaningRecord = async (recordId: number, newData: Partial<CleaningRecord>) => {
    const { error } = await supabase
      .from("cleaning_records")
      .update(newData)
      .eq("id", recordId)

    if (error) {
      console.error("Chyba při aktualizaci záznamu:", error)
      return
    }

    // Aktualizace lokálního stavu
    setCleaningRecords((prev) =>
      prev.map((record) => (record.id === recordId ? { ...record, ...newData } : record))
    )
  }

  const changeWeek = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + direction * 7)
    setSelectedDate(newDate)
  }

  const addNewTap = async () => {
    try {
      setIsAddingTap(true)
      const { data, error } = await supabase
        .from("taps")
        .insert([{ name: `Výčep ${taps.length + 1}` }])
        .select()
        .single()

      if (error) {
        console.error("Chyba při přidávání výčepu:", error)
        return
      }

      if (data) {
        setTaps((prev) => [...prev, data])
      }
    } catch (error) {
      console.error("Neočekávaná chyba při přidávání výčepu:", error)
    } finally {
      setIsAddingTap(false)
    }
  }

  const startEditingTap = (tap: Tap) => {
    setEditingTap(tap.id)
    setNewTapName(tap.name)
  }

  const saveTapName = async () => {
    if (editingTap === null) return

    const { error } = await supabase
      .from("taps")
      .update({ name: newTapName })
      .eq("id", editingTap)

    if (error) {
      console.error("Chyba při aktualizaci názvu výčepu:", error)
      return
    }

    setTaps((prev) => prev.map((tap) => (tap.id === editingTap ? { ...tap, name: newTapName } : tap)))
    setEditingTap(null)
  }

  const handlePrint = () => {
    window.print()
  }

  const getRecordForDateAndTap = (date: Date, tapId: number) => {
    return cleaningRecords.find(
      (record) => record.date === date.toISOString().split("T")[0] && record.tap_id === tapId
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Plán čištění výčepů</span>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{selectedDate.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => changeWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-bold">Výčep</div>
          {weekDays.map((day, index) => (
            <div key={index} className="text-center font-bold">
              {day.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric" })}
            </div>
          ))}

          {taps.map((tap) => (
            <React.Fragment key={tap.id}>
              <div className="font-semibold flex items-center justify-between">
                {editingTap === tap.id ? (
                  <>
                    <Input value={newTapName} onChange={(e) => setNewTapName(e.target.value)} className="w-24" />
                    <Button variant="ghost" size="icon" onClick={saveTapName}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {tap.name}
                    <Button variant="ghost" size="icon" onClick={() => startEditingTap(tap)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              {weekDays.map((day, dayIndex) => {
                const record = getRecordForDateAndTap(day, tap.id)

                return (
                  <Dialog key={dayIndex}>
                    <DialogTrigger asChild>
                      <div className={`border p-2 min-h-20 relative cursor-pointer ${record ? "bg-green-100" : ""}`}>
                        {record ? (
                          <div className="text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {record.time}
                            </div>
                            <div>{record.employee}</div>
                            <div>{record.type}</div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => addCleaningRecord(day, tap.id)}
                          >
                            Zapsat čištění
                          </Button>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detail čištění - {tap.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="date" className="text-right">
                            Datum:
                          </label>
                          <Input id="date" value={day.toLocaleDateString("cs-CZ")} className="col-span-3" readOnly />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="time" className="text-right">
                            Čas:
                          </label>
                          <Input
                            id="time"
                            type="time"
                            value={record?.time || ""}
                            onChange={(e) =>
                              record && updateCleaningRecord(record.id, { time: e.target.value })
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="employee" className="text-right">
                            Zaměstnanec:
                          </label>
                          <Input
                            id="employee"
                            value={record?.employee || ""}
                            onChange={(e) =>
                              record && updateCleaningRecord(record.id, { employee: e.target.value })
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="type" className="text-right">
                            Typ čištění:
                          </label>
                          <Select
                            value={record?.type || ""}
                            onValueChange={(value) => record && updateCleaningRecord(record.id, { type: value })}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Vyberte typ čištění" />
                            </SelectTrigger>
                            <SelectContent>
                              {cleaningTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              })}
            </React.Fragment>
          ))}
        </div>
        <Button onClick={addNewTap} className="mt-4" disabled={isAddingTap}>
          <Plus className="mr-2 h-4 w-4" /> {isAddingTap ? "Přidávám..." : "Přidat nový výčep"}
        </Button>
      </CardContent>
    </Card>
  )
} 