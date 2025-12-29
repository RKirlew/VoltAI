"use client"

import { useState,useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Zap, MapPin, AlertTriangle } from "lucide-react"
import Link from "next/link"

type Severity = "High" | "Medium" | "Low"
interface Incident {
  id: number

  caller: string

  timestamp: string

  incidentType: string

  severity: Severity

  summary: string

  location: {
    lat: number
    lng: number
    address: string
  }
}

const mockIncidents: Incident[] = [
  {
    id: 1,
    caller: "+1 204-555-0100",
    timestamp: "2025-12-16 10:00",
    incidentType: "Power Outage",
    severity: "High",
    summary:
      "Complete power outage affecting downtown district. Approximately 200 customers impacted at Main Street and 5th Avenue.",
    location: {
      lat: 49.8951,
      lng: -97.1384,
      address: "Main Street & 5th Avenue, Downtown",
    },
  },
  {
    id: 2,
    caller: "+1 204-555-0101",
    timestamp: "2025-12-16 09:45",
    incidentType: "Transformer Fault",
    severity: "Medium",
    summary:
      "Transformer making unusual humming sounds and occasional sparking near industrial park. No power loss reported yet.",
    location: {
      lat: 49.9,
      lng: -97.15,
      address: "Industrial Park, Sector B",
    },
  },
  {
    id: 3,
    caller: "+1 204-555-0102",
    timestamp: "2025-12-16 09:30",
    incidentType: "Equipment Damage",
    severity: "Low",
    summary: "Damaged utility pole reported after vehicle collision. No immediate safety hazard.",
    location: {
      lat: 49.885,
      lng: -97.13,
      address: "Broadway Avenue & Osborne Street",
    },
  },
]

export default function AdminPage() {
    const [incidents, setIncidents] = useState<Incident[]>([])

    const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null)
   useEffect(() => {
  fetch("/api/incidents")
    .then((res) => res.json())
    .then((data) => {
      setIncidents(
        data.map((doc: any, index: number) => ({
          id: index + 1, // temporary UI id
          caller: doc.caller ?? "Unknown",
          timestamp: new Date(doc.createdAt).toLocaleString(),
          incidentType: doc.type,
          severity:
            doc.severity === "critical"
              ? "High"
              : doc.severity === "moderate"
              ? "Medium"
              : "Low",
          summary: doc.summary ?? "Summary pending…",
          location: {
            lat: doc.lat ?? 49.8951,
            lng: doc.lng ?? -97.1384,
            address: doc.location,
          },
        }))
      )
    })
}, [])

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "High":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "Low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001829] via-[#00263d] to-[#001829]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00A651] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VoltAI Admin</span>
          </Link>
          <Badge variant="outline" className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/30">
            Incidents Dashboard
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Incident Management</h1>
          <p className="text-gray-400">Monitor and manage all reported incidents with location tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents Table */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">All Incidents</h2>
                <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/30">
                  {incidents.length} Total
                </Badge>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedIncidentId === incident.id ? "bg-white/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold mb-1">{incident.incidentType}</h3>
                      <p className="text-sm text-gray-400">{incident.timestamp}</p>
                    </div>
                    <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{incident.summary}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{incident.location.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Map */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Incident Locations</h2>
            </div>
            <div className="relative h-[600px] bg-[#00263d]">
              {/* Map Container */}
              <div className="absolute inset-0">
                {/* Map Grid Background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
                    {Array.from({ length: 144 }).map((_, i) => (
                      <div key={i} className="border border-white/10" />
                    ))}
                  </div>
                </div>

                {/* Map Markers */}
                <div className="absolute inset-0 p-8">
                  {incidents.map((incident, index) => {
                    const top = 20 + index * 30
                    const left = 30 + index * 25
                    const isSelected = selectedIncidentId === incident.id

                    return (
                      <div
                        key={incident.id}
                        onClick={() => setSelectedIncidentId(incident.id)}
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                        }}
                        className={`absolute cursor-pointer transition-transform ${
                          isSelected ? "scale-125 z-10" : "hover:scale-110"
                        }`}
                      >
                        <div className="relative">
                          {/* Marker Pin */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              incident.severity === "High"
                                ? "bg-red-500"
                                : incident.severity === "Medium"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                            } shadow-lg`}
                          >
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          {/* Pulse Effect */}
                          <div
                            className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                              incident.severity === "High"
                                ? "bg-red-500"
                                : incident.severity === "Medium"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                            }`}
                          />
                          {/* Info Card on Hover/Select */}
                          {isSelected && (
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 bg-[#001829] border border-white/20 rounded-lg p-3 shadow-xl z-20">
                              <h3 className="text-white font-semibold text-sm mb-1">{incident.incidentType}</h3>
                              <p className="text-xs text-gray-400 mb-2">{incident.location.address}</p>
                              <p className="text-xs text-gray-300 mb-2 line-clamp-2">{incident.summary}</p>
                              <div className="flex items-center justify-between">
                                <Badge className={`text-xs ${getSeverityColor(incident.severity)}`}>
                                  {incident.severity}
                                </Badge>
                                <span className="text-xs text-gray-400">{incident.timestamp}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-[#001829]/90 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                  <h3 className="text-white text-sm font-semibold mb-2">Severity Levels</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-300">High Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs text-gray-300">Medium Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-gray-300">Low Priority</span>
                    </div>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-[#001829]/90 backdrop-blur-sm border-white/10 text-white hover:bg-white/10"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
