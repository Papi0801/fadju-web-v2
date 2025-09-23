'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Building2,
    Search,
    Filter,
    MapPin,
    Phone,
    Mail,
    Star,
    Users,
    Calendar,
    Plus,
    Edit,
    Trash2,
    Eye,
    TrendingUp,
    BarChart3,
    Download,
    User,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useEtablissementStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import {
    Button,
    Input,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Modal,
    Loading,
} from '@/components/ui';
import { EtablissementSante } from '@/types';
import { formatDate, phoneNumberFormat } from '@/lib/utils';
import { REGIONS_SENEGAL, ETABLISSEMENT_TYPES } from '@/lib/constants';
import { EtablissementQueries } from '@/lib/firebase/firestore';
import { etablissementStatsService, EtablissementStats } from '@/lib/firebase/etablissement-stats';

const SuperAdminEtablissementsPage: React.FC = () => {
    const {
        etablissements,
        fetchEtablissements,
        deleteEtablissement,
        loading,
    } = useEtablissementStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [sortBy, setSortBy] = useState<'nom' | 'date' | 'note'>('nom');
    const [selectedEtablissement, setSelectedEtablissement] = useState<EtablissementSante | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [selectedStats, setSelectedStats] = useState<EtablissementStats | null>(null);
    const [loadingStats, setLoadingStats] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        fetchEtablissements();
    }, [fetchEtablissements]);

    // Debug function pour tester directement les requêtes Firebase
    const testFirebaseQuery = async () => {
        console.log('🔍 Test des requêtes Firebase...');
        try {
            const allEtabs = await EtablissementQueries.getAllEtablissements();
            const validEtabs = await EtablissementQueries.getEtablissementsValides();
            const enAttenteEtabs = await EtablissementQueries.getEtablissementsEnAttente();

            const debug = {
                total: allEtabs.length,
                valides: validEtabs.length,
                enAttente: enAttenteEtabs.length,
                exemples: allEtabs.slice(0, 3).map(e => ({
                    id: e.id,
                    nom: e.nom,
                    statut_validation: e.statut_validation || 'non défini'
                }))
            };

            setDebugInfo(debug);
            console.log('📊 Résultats Firebase:', debug);
            toast.success(`Trouvé: ${allEtabs.length} total, ${validEtabs.length} validés`);
        } catch (error) {
            console.error('❌ Erreur test Firebase:', error);
            toast.error('Erreur lors du test Firebase');
        }
    };

    // Filtrage et tri des établissements
    const filteredAndSortedEtablissements = etablissements
        .filter((etablissement) => {
            const matchesSearch =
                etablissement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                etablissement.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
                etablissement.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRegion = !selectedRegion || etablissement.region === selectedRegion;
            const matchesType = !selectedType || etablissement.type === selectedType;

            return matchesSearch && matchesRegion && matchesType;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'nom':
                    return a.nom.localeCompare(b.nom);
                case 'date':
                    return b.date_creation.toDate().getTime() - a.date_creation.toDate().getTime();
                case 'note':
                    return b.note - a.note;
                default:
                    return 0;
            }
        });

    // Statistiques
    const stats = {
        total: etablissements.length,
        hopitaux: etablissements.filter(e => e.type === 'hopital').length,
        cliniques: etablissements.filter(e => e.type === 'clinique').length,
        cabinets: etablissements.filter(e => e.type === 'cabinet').length,
        moyenneNote: etablissements.length > 0
            ? (etablissements.reduce((acc, e) => acc + e.note, 0) / etablissements.length).toFixed(1)
            : '0',
        avec24h: etablissements.filter(e => e.ouvert_24h).length,
        avecUrgence: etablissements.filter(e => e.service_urgence).length,
    };

    const handleDelete = async (id: string, nom: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ? Cette action est irréversible.`)) {
            return;
        }

        setDeleteLoading(id);
        try {
            await deleteEtablissement(id);
            toast.success('Établissement supprimé avec succès');
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteLoading(null);
        }
    };

    const openDetailModal = (etablissement: EtablissementSante) => {
        setSelectedEtablissement(etablissement);
        setIsDetailModalOpen(true);
    };

    const openStatsModal = async (etablissement: EtablissementSante) => {
        setLoadingStats(etablissement.id);
        try {
            const stats = await etablissementStatsService.getEtablissementStats(
                etablissement.id,
                etablissement.nom
            );
            setSelectedStats(stats);
            setIsStatsModalOpen(true);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            toast.error('Erreur lors du chargement des statistiques');
        } finally {
            setLoadingStats(null);
        }
    };

    const exportData = () => {
        const data = filteredAndSortedEtablissements.map(e => ({
            nom: e.nom,
            type: e.type,
            ville: e.ville,
            region: e.region,
            telephone: e.telephone,
            email: e.email,
            note: e.note,
            nombre_avis: e.nombre_avis,
        }));

        const csv = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `etablissements_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Export terminé');
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loading text="Chargement des établissements..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Gestion des Établissements
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Gérez tous les établissements de santé validés du système
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="secondary"
                            onClick={testFirebaseQuery}
                            className="flex items-center space-x-2"
                        >
                            <Search className="w-4 h-4" />
                            <span>Test Firebase</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={exportData}
                            className="flex items-center space-x-2"
                            disabled={filteredAndSortedEtablissements.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            <span>Exporter</span>
                        </Button>
                        <Badge variant="primary" size="lg" className="px-4 py-2">
                            {filteredAndSortedEtablissements.length} établissement(s)
                        </Badge>
                    </div>
                </div>

                {/* Debug Info Card */}
                {debugInfo && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="text-yellow-800">🔍 Debug Firebase</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <p className="text-sm font-medium text-yellow-700">Total DB</p>
                                    <p className="text-2xl font-bold text-yellow-900">{debugInfo.total}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-yellow-700">Validés</p>
                                    <p className="text-2xl font-bold text-yellow-900">{debugInfo.valides}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-yellow-700">En attente</p>
                                    <p className="text-2xl font-bold text-yellow-900">{debugInfo.enAttente}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-yellow-700">Store actuel</p>
                                    <p className="text-2xl font-bold text-yellow-900">{etablissements.length}</p>
                                </div>
                            </div>
                            {debugInfo.exemples && debugInfo.exemples.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-yellow-700 mb-2">Exemples:</p>
                                    <div className="space-y-1">
                                        {debugInfo.exemples.map((ex: any, idx: number) => (
                                            <p key={idx} className="text-xs text-yellow-600">
                                                {ex.nom} - Statut: {ex.statut_validation}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.hopitaux}</p>
                                <p className="text-sm text-muted-foreground">Hôpitaux</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.cliniques}</p>
                                <p className="text-sm text-muted-foreground">Cliniques</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{stats.cabinets}</p>
                                <p className="text-sm text-muted-foreground">Cabinets</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{stats.moyenneNote}/5</p>
                                <p className="text-sm text-muted-foreground">Note moy.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{stats.avec24h}</p>
                                <p className="text-sm text-muted-foreground">24h/24</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{stats.avecUrgence}</p>
                                <p className="text-sm text-muted-foreground">Urgences</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtres */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Rechercher par nom, ville ou description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    leftIcon={<Search className="w-4 h-4" />}
                                />
                            </div>

                            <div>
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Toutes les régions</option>
                                    {REGIONS_SENEGAL.map((region) => (
                                        <option key={region} value={region}>
                                            {region}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Tous les types</option>
                                    <option value="hopital">Hôpital</option>
                                    <option value="clinique">Clinique</option>
                                    <option value="cabinet">Cabinet</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'nom' | 'date' | 'note')}
                                    className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="nom">Trier par nom</option>
                                    <option value="date">Trier par date</option>
                                    <option value="note">Trier par note</option>
                                </select>
                            </div>
                        </div>

                        {(searchTerm || selectedRegion || selectedType) && (
                            <div className="mt-4 flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                                {searchTerm && (
                                    <Badge variant="secondary" className="text-xs">
                                        Recherche: "{searchTerm}"
                                    </Badge>
                                )}
                                {selectedRegion && (
                                    <Badge variant="secondary" className="text-xs">
                                        Région: {selectedRegion}
                                    </Badge>
                                )}
                                {selectedType && (
                                    <Badge variant="secondary" className="text-xs">
                                        Type: {selectedType}
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedRegion('');
                                        setSelectedType('');
                                    }}
                                    className="text-xs"
                                >
                                    Effacer
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Liste des établissements */}
                {filteredAndSortedEtablissements.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Aucun établissement trouvé
                            </h3>
                            <p className="text-muted-foreground">
                                {searchTerm || selectedRegion || selectedType
                                    ? 'Aucun établissement ne correspond à vos critères de recherche.'
                                    : 'Aucun établissement n\'a été validé pour le moment.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredAndSortedEtablissements.map((etablissement, index) => (
                            <motion.div
                                key={etablissement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.005 }}
                            >
                                <Card className="hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                                                    <Building2 className="w-8 h-8 text-primary" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-foreground mb-1">
                                                                {etablissement.nom}
                                                            </h3>
                                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                    {etablissement.ville}, {etablissement.region}
                                </span>
                                                                <span className="flex items-center">
                                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                                                    {etablissement.note}/5 ({etablissement.nombre_avis} avis)
                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="primary" className="capitalize">
                                                                {etablissement.type}
                                                            </Badge>
                                                            <Badge variant="success">Validé</Badge>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                                        {/* Contact */}
                                                        <div>
                                                            <h4 className="font-semibold mb-2 text-sm">Contact</h4>
                                                            <div className="space-y-1 text-sm">
                                                                <p className="flex items-center text-muted-foreground">
                                                                    <Phone className="w-3 h-3 mr-2" />
                                                                    {phoneNumberFormat(etablissement.telephone)}
                                                                </p>
                                                                <p className="flex items-center text-muted-foreground">
                                                                    <Mail className="w-3 h-3 mr-2" />
                                                                    {etablissement.email}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Services */}
                                                        <div>
                                                            <h4 className="font-semibold mb-2 text-sm">Services</h4>
                                                            <div className="flex flex-wrap gap-1">
                                                                {etablissement.services.slice(0, 3).map((service, idx) => (
                                                                    <Badge key={idx} variant="secondary" size="sm">
                                                                        {service}
                                                                    </Badge>
                                                                ))}
                                                                {etablissement.services.length > 3 && (
                                                                    <Badge variant="secondary" size="sm">
                                                                        +{etablissement.services.length - 3}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Caractéristiques */}
                                                        <div>
                                                            <h4 className="font-semibold mb-2 text-sm">Informations</h4>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center">
                                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                        etablissement.ouvert_24h ? 'bg-green-500' : 'bg-gray-300'
                                                                    }`} />
                                                                    <span className="text-muted-foreground">
                                    {etablissement.ouvert_24h ? 'Ouvert 24h/24' : 'Horaires limités'}
                                  </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                        etablissement.service_urgence ? 'bg-green-500' : 'bg-gray-300'
                                                                    }`} />
                                                                    <span className="text-muted-foreground">
                                    {etablissement.service_urgence ? 'Service urgence' : 'Pas d\'urgence'}
                                  </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                        {etablissement.description}
                                                    </p>

                                                    {/* Actions */}
                                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                                        <div className="text-sm text-muted-foreground">
                                                            Validé le {formatDate(etablissement.date_creation.toDate())}
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDetailModal(etablissement)}
                                                                className="flex items-center space-x-1"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                <span>Détails</span>
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openStatsModal(etablissement)}
                                                                loading={loadingStats === etablissement.id}
                                                                disabled={loadingStats !== null}
                                                                className="flex items-center space-x-1"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                                <span>Stats</span>
                                                            </Button>

                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(etablissement.id, etablissement.nom)}
                                                                loading={deleteLoading === etablissement.id}
                                                                disabled={deleteLoading !== null}
                                                                className="flex items-center space-x-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                <span>Supprimer</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Modal de détails */}
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Détails de l'établissement"
                    size="xl"
                >
                    {selectedEtablissement && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-10 h-10 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold">{selectedEtablissement.nom}</h3>
                                    <p className="text-muted-foreground mt-1">
                                        {selectedEtablissement.description}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-3">
                                        <Badge variant="primary" className="capitalize">
                                            {selectedEtablissement.type}
                                        </Badge>
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                            <span className="font-medium">{selectedEtablissement.note}/5</span>
                                            <span className="text-muted-foreground ml-1">
                        ({selectedEtablissement.nombre_avis} avis)
                      </span>
                                        </div>
                                        <Badge variant="success">Validé</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Informations détaillées */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Localisation */}
                                <div>
                                    <h4 className="font-semibold mb-3">Localisation</h4>
                                    <div className="space-y-2">
                                        <p><strong>Adresse:</strong> {selectedEtablissement.adresse}</p>
                                        <p><strong>Ville:</strong> {selectedEtablissement.ville}</p>
                                        <p><strong>Région:</strong> {selectedEtablissement.region}</p>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div>
                                    <h4 className="font-semibold mb-3">Contact</h4>
                                    <div className="space-y-2">
                                        <p><strong>Téléphone:</strong> {phoneNumberFormat(selectedEtablissement.telephone)}</p>
                                        <p><strong>Email:</strong> {selectedEtablissement.email}</p>
                                        {selectedEtablissement.site_web && (
                                            <p>
                                                <strong>Site web:</strong>{' '}
                                                <a
                                                    href={selectedEtablissement.site_web}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    {selectedEtablissement.site_web}
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Services et spécialités */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold mb-3">Services proposés</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEtablissement.services.map((service, index) => (
                                            <Badge key={index} variant="secondary">
                                                {service}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3">Spécialités médicales</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEtablissement.specialites.map((specialite, index) => (
                                            <Badge key={index} variant="primary">
                                                {specialite}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Horaires */}
                            <div>
                                <h4 className="font-semibold mb-3">Horaires de travail</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(selectedEtablissement.horaires_travail).map(([jour, horaire]) => (
                                        <div key={jour} className="bg-muted p-3 rounded-lg">
                                            <p className="font-medium capitalize">{jour}</p>
                                            <p className="text-sm text-muted-foreground">{horaire}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Caractéristiques */}
                            <div>
                                <h4 className="font-semibold mb-3">Caractéristiques</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${selectedEtablissement.ouvert_24h ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Ouvert 24h/24</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${selectedEtablissement.service_urgence ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Service d'urgence</span>
                                    </div>
                                </div>
                            </div>

                            {/* Statistiques */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3">Statistiques</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-primary">{selectedEtablissement.note}</p>
                                        <p className="text-sm text-muted-foreground">Note moyenne</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{selectedEtablissement.nombre_avis}</p>
                                        <p className="text-sm text-muted-foreground">Avis</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{selectedEtablissement.services.length}</p>
                                        <p className="text-sm text-muted-foreground">Services</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Modal de statistiques détaillées */}
                <Modal
                    isOpen={isStatsModalOpen}
                    onClose={() => setIsStatsModalOpen(false)}
                    title={`Statistiques - ${selectedStats?.etablissementNom || ''}`}
                    size="xl"
                >
                    {selectedStats && (
                        <div className="space-y-6">
                            {/* Vue d'ensemble */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{selectedStats.totalRendezVous}</p>
                                    <p className="text-sm text-muted-foreground">Rendez-vous total</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{selectedStats.totalPatients}</p>
                                    <p className="text-sm text-muted-foreground">Patients total</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-2xl font-bold text-purple-600">{selectedStats.totalMedecins}</p>
                                    <p className="text-sm text-muted-foreground">Médecins</p>
                                </div>
                                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-2xl font-bold text-orange-600">{selectedStats.tauxConfirmation}%</p>
                                    <p className="text-sm text-muted-foreground">Taux confirmation</p>
                                </div>
                            </div>

                            {/* Statistiques détaillées */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personnel */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Users className="w-5 h-5" />
                                            <span>Personnel</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Médecins total</span>
                                            <Badge variant="primary">{selectedStats.totalMedecins}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Médecins actifs</span>
                                            <Badge variant="success">{selectedStats.medecinActifs}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Secrétaires</span>
                                            <Badge variant="secondary">{selectedStats.totalSecretaires}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Patients */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <User className="w-5 h-5" />
                                            <span>Patients</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Total patients</span>
                                            <Badge variant="primary">{selectedStats.totalPatients}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Nouveaux (30j)</span>
                                            <Badge variant="success">{selectedStats.nouveauPatients30j}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Patients actifs</span>
                                            <Badge variant="secondary">{selectedStats.patientsActifs}</Badge>
                                        </div>
                                        {selectedStats.croissancePatients !== 0 && (
                                            <div className="flex justify-between">
                                                <span>Croissance (30j)</span>
                                                <Badge variant={selectedStats.croissancePatients > 0 ? 'success' : 'destructive'}>
                                                    {selectedStats.croissancePatients > 0 ? '+' : ''}{selectedStats.croissancePatients}%
                                                </Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Rendez-vous */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Calendar className="w-5 h-5" />
                                            <span>Rendez-vous</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Total</span>
                                            <Badge variant="primary">{selectedStats.totalRendezVous}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Confirmés</span>
                                            <Badge variant="success">{selectedStats.rdvConfirmes}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>En attente</span>
                                            <Badge variant="warning">{selectedStats.rdvEnAttente}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Terminés</span>
                                            <Badge variant="secondary">{selectedStats.rdvTermines}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Annulés</span>
                                            <Badge variant="destructive">{selectedStats.rdvAnnules}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Performance */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <TrendingUp className="w-5 h-5" />
                                            <span>Performance</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>RDV/jour (moyenne)</span>
                                            <Badge variant="primary">{selectedStats.moyenneRdvParJour}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>RDV/médecin</span>
                                            <Badge variant="secondary">{selectedStats.moyenneRdvParMedecin}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Taux confirmation</span>
                                            <Badge variant={selectedStats.tauxConfirmation > 80 ? 'success' : selectedStats.tauxConfirmation > 60 ? 'warning' : 'destructive'}>
                                                {selectedStats.tauxConfirmation}%
                                            </Badge>
                                        </div>
                                        {selectedStats.croissanceRdv !== 0 && (
                                            <div className="flex justify-between">
                                                <span>Croissance RDV (30j)</span>
                                                <Badge variant={selectedStats.croissanceRdv > 0 ? 'success' : 'destructive'}>
                                                    {selectedStats.croissanceRdv > 0 ? '+' : ''}{selectedStats.croissanceRdv}%
                                                </Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Activité récente */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Clock className="w-5 h-5" />
                                        <span>Activité récente</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-muted rounded-lg">
                                            <p className="text-lg font-semibold text-primary">{selectedStats.rdv7j}</p>
                                            <p className="text-sm text-muted-foreground">RDV (7 derniers jours)</p>
                                        </div>
                                        <div className="text-center p-3 bg-muted rounded-lg">
                                            <p className="text-lg font-semibold text-primary">{selectedStats.rdv30j}</p>
                                            <p className="text-sm text-muted-foreground">RDV (30 derniers jours)</p>
                                        </div>
                                        <div className="text-center p-3 bg-muted rounded-lg">
                                            <p className="text-sm text-muted-foreground">Dernière activité</p>
                                            <p className="text-sm font-medium">
                                                {selectedStats.derniereActivite
                                                    ? formatDate(selectedStats.derniereActivite)
                                                    : 'Aucune donnée'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {selectedStats.dernierRdv && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                                <strong>Dernier rendez-vous :</strong> {formatDate(selectedStats.dernierRdv)}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </Modal>
            </motion.div>
        </DashboardLayout>
    );
};

export default SuperAdminEtablissementsPage;
