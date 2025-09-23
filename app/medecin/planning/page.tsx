'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, MapPin, FileText, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Loading, Button } from '@/components/ui';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { RendezVous, DossierPatient } from '@/types';

moment.locale('fr');
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    rendezVous: RendezVous;
    patient: DossierPatient | null;
  };
}

const eventStyleGetter = (event: CalendarEvent) => {
  let backgroundColor = '#3b82f6'; // Bleu par défaut
  
  switch (event.resource.rendezVous.statut) {
    case 'confirmee':
      backgroundColor = '#22c55e'; // Vert
      break;
    case 'en_attente':
      backgroundColor = '#f59e0b'; // Orange
      break;
    case 'annulee':
      backgroundColor = '#ef4444'; // Rouge
      break;
    case 'terminee':
      backgroundColor = '#6b7280'; // Gris
      break;
  }

  return {
    style: {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block'
    }
  };
};

const MedecinPlanningPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const fetchRendezVous = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Récupérer uniquement les rendez-vous du médecin connecté
      const rendezVousList = await rendezVousService.getRendezVousByMedecin(user.id);
      
      // Récupérer les informations des patients
      const patientsMap = new Map<string, DossierPatient>();

      // Récupérer les patients uniques
      const patientIds = [...new Set(rendezVousList.map(rv => rv.patient_id))];
      await Promise.all(
        patientIds.map(async (patientId) => {
          try {
            const patient = await dossierPatientService.getByPatientId(patientId);
            if (patient) {
              patientsMap.set(patientId, patient);
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du patient ${patientId}:`, error);
          }
        })
      );

      // Créer les événements pour le calendrier
      const calendarEvents: (CalendarEvent | null)[] = rendezVousList.map(rv => {
        const dateRdv = rv.date_rendez_vous.toDate();
        
        // Vérifier que les heures existent et sont valides
        if (!rv.heure_debut || !rv.heure_fin) {
          console.warn(`RDV ${rv.id} manque les heures:`, { heure_debut: rv.heure_debut, heure_fin: rv.heure_fin });
          return null;
        }
        
        const [heureDebut, minuteDebut] = rv.heure_debut.split(':').map(Number);
        const [heureFin, minuteFin] = rv.heure_fin.split(':').map(Number);
        
        const start = new Date(dateRdv);
        start.setHours(heureDebut, minuteDebut, 0, 0);
        
        const end = new Date(dateRdv);
        end.setHours(heureFin, minuteFin, 0, 0);

        const patient = patientsMap.get(rv.patient_id) || null;

        return {
          id: rv.id,
          title: patient ? `${patient.prenom} ${patient.nom}` : 'Patient',
          start,
          end,
          resource: {
            rendezVous: rv,
            patient
          }
        };
      }).filter(Boolean) as CalendarEvent[]; // Filtrer les null

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      toast.error('Erreur lors du chargement du planning');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRendezVous();
  }, [fetchRendezVous]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return <Badge variant="success">Confirmé</Badge>;
      case 'en_attente':
        return <Badge variant="warning">En attente</Badge>;
      case 'annulee':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'terminee':
        return <Badge variant="default">Terminé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loading text="Chargement du planning..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 h-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon Planning</h1>
            <p className="text-muted-foreground mt-2">
              Vue d'ensemble de vos rendez-vous
            </p>
          </div>
          <Button
            onClick={() => router.push('/medecin/consultations/add')}
            className="flex items-center space-x-2"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Ajouter une consultation</span>
          </Button>
        </div>

        {/* Légende des statuts */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Confirmé</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span>En attente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Annulé</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span>Terminé</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendrier */}
        <Card className="flex-1">
          <CardContent className="p-4 h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              messages={{
                next: "Suivant",
                previous: "Précédent",
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
                agenda: "Agenda",
                date: "Date",
                time: "Heure",
                event: "Événement",
                noEventsInRange: "Aucun rendez-vous dans cette période",
                showMore: (total) => `+ ${total} rendez-vous`
              }}
              formats={{
                dayFormat: 'DD/MM',
                dayHeaderFormat: 'dddd DD/MM',
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
                monthHeaderFormat: 'MMMM YYYY',
                weekdayFormat: 'ddd',
                timeGutterFormat: 'HH:mm',
              }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de détails du rendez-vous */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeEventDetails}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Détails du rendez-vous</h2>
                {getStatutBadge(selectedEvent.resource.rendezVous.statut)}
              </div>

              {selectedEvent.resource.patient && (
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Patient</span>
                  </h3>
                  <p className="font-medium">
                    {selectedEvent.resource.patient.prenom} {selectedEvent.resource.patient.nom}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{selectedEvent.resource.patient.telephone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{selectedEvent.resource.patient.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="default" className="text-xs">
                      {selectedEvent.resource.patient.groupe_sanguin}
                    </Badge>
                    {selectedEvent.resource.patient.allergie && (
                      <Badge variant="destructive" className="text-xs">
                        Allergies: {selectedEvent.resource.patient.allergie}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Date et heure</span>
                </h3>
                <p>{moment(selectedEvent.start).format('dddd DD MMMM YYYY')}</p>
                <p className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Motif</span>
                </h3>
                <p className="text-muted-foreground">{selectedEvent.resource.rendezVous.motif}</p>
              </div>

              {selectedEvent.resource.rendezVous.notes_secretaire && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Notes du secrétaire</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedEvent.resource.rendezVous.notes_secretaire}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeEventDetails}
                >
                  Fermer
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (selectedEvent.resource.patient && selectedEvent.resource.patient.patient_id) {
                      router.push(`/medecin/patients/${selectedEvent.resource.patient.patient_id}`);
                      closeEventDetails();
                    } else {
                      toast.error('Dossier patient introuvable');
                    }
                  }}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="w-4 h-4" />
                  <span>Dossier médical</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MedecinPlanningPage;