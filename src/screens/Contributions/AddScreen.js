import React, { useEffect, useState, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import { useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { Input, RHFLocationInput } from '@components/FormInputs';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@services/supabaseClient';

const CONTRIBUTION_TYPES = [
	{ value: 'cash', label: 'Cash' },
	{ value: 'gold', label: 'Gold' },
];

export default function AddContributionScreen({ navigation, route }) {
	const functionId = route?.params?.functionId;
	const { user } = useAuth();
	const [submitting, setSubmitting] = useState(false);
	const [functionType, setFunctionType] = useState(null);
	const [matchedContribution, setMatchedContribution] = useState(null);
	const [matchingLoading, setMatchingLoading] = useState(false);
	const matchTimer = React.useRef(null);

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { isSubmitting },
	} = useForm({
		defaultValues: {
			place_id: null,
			family_name: '',
			person_name: '',
			spouse_name: '',
			contribution_type: 'cash',
			amount: '',
			notes: '',
		},
	});

	useEffect(() => {
		if (!functionId) {
			Toast.show({
				type: 'error',
				text1: 'Invalid function ID',
			});
			navigation.goBack();
		}
	}, [functionId, navigation]);

	useEffect(() => {
		const loadFunctionType = async () => {
			if (!functionId) return;
			try {
				const { data, error } = await supabase
					.from('functions')
					.select('function_type')
					.eq('id', functionId)
					.single();

				if (error) {
					throw error;
				}

				setFunctionType(data?.function_type || null);
			} catch (error) {
				console.error('[AddContribution] Failed to load function type:', error);
			}
		};

		loadFunctionType();
	}, [functionId]);

	const saveContribution = useCallback(
		async (values, exitAfter = false) => {
			try {
				setSubmitting(true);

				if (!user?.id) {
					Toast.show({ type: 'error', text1: 'User not authenticated' });
					return;
				}

				const payload = {
					function_id: functionId,
					place_id: values.place_id,
					family_name: values.family_name?.trim() || null,
					person_name: values.person_name?.trim() || '',
					spouse_name: values.spouse_name?.trim() || null,
					contribution_type: values.contribution_type,
					amount: parseFloat(values.amount) || 0,
					notes: values.notes?.trim() || null,
					direction: 'GIVEN_TO_ME',
					returned: false,
					user_id: user.id,
				};

				const { data, error } = await supabase
					.from('contributions')
					.insert(payload)
					.select()
					.single();

				if (error) {
					throw error;
				}

				Toast.show({
					type: 'success',
					text1: 'Contribution saved',
				});

				if (exitAfter) {
					navigation.goBack();
				} else {
					const selectedPlaceId = values.place_id;
					reset({
						place_id: selectedPlaceId,
						family_name: '',
						person_name: '',
						spouse_name: '',
						contribution_type: 'cash',
						amount: '',
						notes: '',
					});
				}
			} catch (error) {
				console.error('[AddContribution] Error:', error);
				Toast.show({
					type: 'error',
					text1: 'Failed to save contribution',
					text2: error.message,
				});
			} finally {
				setSubmitting(false);
			}
		},
		[functionId, user, reset, navigation]
	);

	const onSaveAndAddNext = useCallback(
		async (values) => {
			await saveContribution(values, false);
		},
		[saveContribution]
	);

	const onSaveAndExit = useCallback(
		async (values) => {
			await saveContribution(values, true);
		},
		[saveContribution]
	);

	const contributionType = watch('contribution_type');
	const watchPersonName = watch('person_name');
	const watchPlaceId = watch('place_id');
	const watchFamilyName = watch('family_name');

	useEffect(() => {
		if (functionType !== 'INVITATION') {
			setMatchedContribution(null);
			return;
		}

		const personName = watchPersonName?.trim();
		const placeId = watchPlaceId;
		const familyName = watchFamilyName?.trim();

		if (!personName || !placeId) {
			setMatchedContribution(null);
			return;
		}

		if (matchTimer.current) {
			clearTimeout(matchTimer.current);
		}

		matchTimer.current = setTimeout(async () => {
			setMatchingLoading(true);
			try {
				let query = supabase
					.from('contributions')
					.select('id, person_name, family_name, amount, contribution_type, function_id, functions(title, function_date), locations:place_id(id, name, tamil_name)')
					.eq('direction', 'GIVEN_TO_ME')
					.eq('returned', false)
					.eq('place_id', placeId)
					.ilike('person_name', `%${personName}%`)
					.order('created_at', { ascending: false })
					.limit(1);

				if (familyName) {
					query = query.ilike('family_name', `%${familyName}%`);
				}

				const { data, error } = await query;

				if (error) {
					throw error;
				}

				setMatchedContribution(data?.[0] || null);
			} catch (error) {
				console.error('[AddContribution] Match lookup error:', error);
				setMatchedContribution(null);
			} finally {
				setMatchingLoading(false);
			}
		}, 400);

		return () => {
			if (matchTimer.current) {
				clearTimeout(matchTimer.current);
			}
		};
	}, [functionType, watchPersonName, watchPlaceId, watchFamilyName]);

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			<Text style={styles.title}>Add Contribution</Text>

			<View style={styles.formCard}>
				<RHFLocationInput
					name="place_id"
					control={control}
					label="Location"
					placeholder="Search or select location"
					rules={{ required: 'Location is required' }}
				/>

				<Input
					name="family_name"
					label="Family Name"
					control={control}
					placeholder="Optional"
					voice={false}
				/>

				<Input
					name="person_name"
					label="Person Name"
					control={control}
					rules={{ required: 'Person name is required' }}
					placeholder="Required"
					voice={false}
				/>

				{functionType === 'INVITATION' && (matchingLoading || matchedContribution) ? (
					<View style={styles.matchCard}>
						<Text style={styles.matchTitle}>Past Contribution</Text>
						{matchingLoading ? (
							<Text style={styles.matchLoading}>Searching...</Text>
						) : (
							<>
								<Text style={styles.matchName}>{matchedContribution?.person_name}</Text>
								<Text style={styles.matchPlace}>
									{matchedContribution?.locations?.name}
									{matchedContribution?.locations?.tamil_name ? ` · ${matchedContribution.locations.tamil_name}` : ''}
								</Text>
								<Text style={styles.matchAmount}>
									{matchedContribution?.contribution_type === 'gold'
										? `${matchedContribution?.amount} grams`
										: `₹${parseFloat(matchedContribution?.amount || 0).toLocaleString('en-IN')}`}
								</Text>
								<Text style={styles.matchFunction}>
									{matchedContribution?.functions?.title || 'Unknown function'}
									{matchedContribution?.functions?.function_date ? ` · ${new Date(matchedContribution.functions.function_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` : ''}
								</Text>
							</>
						)}
					</View>
				) : null}

				<Input
					name="spouse_name"
					label="Spouse Name"
					control={control}
					placeholder="Optional"
					voice={false}
				/>

				<Text style={styles.fieldLabel}>Contribution Type</Text>
				<View style={styles.typeToggle}>
					{CONTRIBUTION_TYPES.map(option => {
						const isActive = contributionType === option.value;
						return (
							<TouchableOpacity
								key={option.value}
								style={[styles.typeOption, isActive && styles.typeOptionActive]}
								onPress={() => setValue('contribution_type', option.value, { shouldValidate: true })}
							>
								<Text style={[styles.typeOptionText, isActive && styles.typeOptionTextActive]}>
									{option.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				<Input
					name="amount"
					label="Amount"
					control={control}
					rules={{ required: 'Amount is required' }}
					placeholder="0.00"
					type="number"
					voice={false}
				/>

				<Input
					name="notes"
					label="Notes"
					control={control}
					placeholder="Optional"
					voice={false}
				/>
			</View>

			<View style={styles.actions}>
				<TouchableOpacity
					style={[styles.button, styles.cancelButton]}
					onPress={() => navigation.goBack()}
					disabled={isSubmitting || submitting}
				>
					<Text style={styles.buttonText}>Cancel</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.nextButton]}
					onPress={handleSubmit(onSaveAndAddNext)}
					disabled={isSubmitting || submitting}
				>
					<Text style={styles.buttonText}>
						{isSubmitting || submitting ? 'Saving...' : 'Save & Add Next'}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, styles.exitButton]}
					onPress={handleSubmit(onSaveAndExit)}
					disabled={isSubmitting || submitting}
				>
					<Text style={styles.buttonText}>
						{isSubmitting || submitting ? 'Saving...' : 'Save & Exit'}
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F6F8FA',
	},
	content: {
		padding: 16,
		paddingBottom: 40,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#1a1a1a',
		marginBottom: 24,
	},
	formCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 24,
		elevation: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
	},
	fieldLabel: {
		marginBottom: 6,
		fontSize: 14,
		fontWeight: '500',
		color: '#333',
	},
	matchCard: {
		backgroundColor: '#F5F7FA',
		borderRadius: 10,
		padding: 12,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#E0E0E0',
	},
	matchTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#666',
		marginBottom: 6,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	matchLoading: {
		fontSize: 13,
		color: '#777',
	},
	matchName: {
		fontSize: 15,
		fontWeight: '600',
		color: '#333',
	},
	matchPlace: {
		fontSize: 13,
		color: '#555',
		marginTop: 4,
	},
	matchAmount: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1976D2',
		marginTop: 6,
	},
	matchFunction: {
		fontSize: 12,
		color: '#777',
		marginTop: 4,
	},
	typeToggle: {
		flexDirection: 'row',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ddd',
		overflow: 'hidden',
		marginBottom: 16,
	},
	typeOption: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	typeOptionActive: {
		backgroundColor: '#1976D2',
	},
	typeOptionText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#666',
	},
	typeOptionTextActive: {
		color: '#fff',
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	button: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: 'center',
		minHeight: 48,
		justifyContent: 'center',
	},
	cancelButton: {
		backgroundColor: '#9E9E9E',
	},
	nextButton: {
		backgroundColor: '#1976D2',
	},
	exitButton: {
		backgroundColor: '#4CAF50',
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '600',
	},
});
