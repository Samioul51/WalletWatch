import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../providers/AuthProvider/AuthProvider";
import axiosSecure from "../../utils/axios/axioshelper";
import { Search, ChevronDown } from "lucide-react";
import { IoMdCreate } from "react-icons/io";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Pagination from "@mui/material/Pagination";
import CardSkeleton from "../../components/cardSkeleton/CardSkeleton";

// Income validation schema

const createIncomeSchema = z.object({
	title: z.string().min(1, "Title is required"),
	amount: z
		.number({ error: "Amount is required" })
		.positive("Amount must be greater than 0"),
	source: z.enum(["Salary", "Freelance", "Business", "Gift", "Others"], {
		error: "Source is required",
	}),
	note: z.string().optional(),
});

const MyIncomes = () => {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm({
		resolver: zodResolver(createIncomeSchema),
		defaultValues: {
			title: "",
			amount: "",
			source: "Others",
			note: "",
		},
	});

	const { userData } = useContext(AuthContext);

	const [incomes, setIncomes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [source, setSource] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const limit = 10;

	useEffect(() => {
		const fetchIncomes = async () => {
			setLoading(true);
			try {
				const res = await axiosSecure.get("/incomes", {
					params: {
						page,
						limit,
						...(searchTerm && { search: searchTerm }),
						...(source && { source }),
						...(startDate && { startDate }),
						...(endDate && { endDate }),
					},
				});

				// console.log(res.data.totalPages);

				setIncomes(res.data.data);
				setTotalPages(res.data.totalPages || 1);
			} catch (error) {
				// console.log(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (userData?.email) fetchIncomes();
	}, [userData?.email, page, searchTerm, source, startDate, endDate]);

	// Add income related

	const incomeCreateModalRef = useRef();

	const openIncomeCreateModal = () => {
		incomeCreateModalRef.current?.showModal();
	};

	const closeIncomeCreateModal = () => {
		incomeCreateModalRef.current?.close();
	};

	const handleCreateIncome = async (data) => {
		try {
			const res = await axiosSecure.post("/incomes", data);

			reset();
			closeIncomeCreateModal();
			toast.success("Income added successfully");

			setIncomes((prev) => [res.data.data, ...prev]);
		} catch (error) {
			// console.log(error.message);
			toast.error("Income add failed");
		}
	};

	// Deletion related

	const deleteIncomeModalRef = useRef();
	const [selectedIncomeId, setSelectedIncomeId] = useState(null);

	const openDeleteIncomeModal = (id) => {
		setSelectedIncomeId(id);

		deleteIncomeModalRef.current?.showModal();
	};

	const closeDeleteIncomeModal = () => {
		deleteIncomeModalRef.current?.close();
	};

	const handleDeleteIncome = async () => {
		setLoading(true);
		try {
			await axiosSecure.delete(`/incomes/${selectedIncomeId}`);

			setIncomes((prev) =>
				prev.filter((income) => income._id !== selectedIncomeId),
			);

			closeDeleteIncomeModal();

			toast.success("Income deleted successfully");
		} catch (error) {
			// console.log(error.message);

			toast.error("Income delete failed");
		} finally {
			setLoading(false);
		}
	};

	// Edit related

	const incomeEditModalRef = useRef();
	const [selectedIncome, setSelectedIncome] = useState(null);

	const {
		register: editRegister,
		handleSubmit: handleEditSubmit,
		formState: { errors: editErrors, isSubmitting: isEditSubmitting },
		reset: editReset,
	} = useForm({
		defaultValues: {
			amount: "",
			note: "",
		},
	});

	const openIncomeEditModal = (income) => {
		setSelectedIncome(income);

		editReset({
			amount: income.amount,
			note: income.note || "",
		});

		incomeEditModalRef.current?.showModal();
	};

	const closeIncomeEditModal = () => {
		incomeEditModalRef.current?.close();
	};

	const handleUpdateIncome = async (data) => {
		if (
			data.amount === selectedIncome.amount &&
			(data.note || "") === (selectedIncome.note || "")
		) {
			closeIncomeEditModal();
			toast.error("No changes detected");
			return;
		}

		try {
			const res = await axiosSecure.patch(
				`/incomes/${selectedIncome._id}`,
				data,
			);

			setIncomes((prev) =>
				prev.map((income) =>
					income._id === selectedIncome._id ? res.data.data : income,
				),
			);

			closeIncomeEditModal();

			toast.success("Income updated successfully");
		} catch (error) {
			// console.log(error.message);

			toast.error("Income update failed");
		}
	};

	// console.log(incomes);

	return (
		<div className="w-full flex flex-col inter">
			{/* Heading */}

			<div className="flex flex-col items-start gap-2 mb-10">
				<p className="text-4xl font-bold lobster">My Incomes</p>
				<p className="text-sm font-medium text-gray-400">
					Manage your income records and stay updated on your earnings
				</p>
			</div>

			{/* Filters and Add button */}

			<div className="w-full flex flex-col md:flex-row justify-between items-end gap-5 mb-10">
				<div className="w-full flex-1 flex flex-col gap-2">
					<span className="text-sm font-semibold text-gray-600">Search</span>
					<div className="w-full flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-[9px] shadow-sm focus-within:ring-2 focus-within:ring-black transition-all">
						<Search className="w-4 h-4 text-gray-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setPage(1);
							}}
							placeholder="Search income"
							className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
						/>
					</div>
				</div>

				<div className="w-full md:w-48 flex flex-col gap-2">
					<span className="text-sm font-semibold text-gray-600">Source</span>
					<div className="relative w-full">
						<select
							value={source}
							onChange={(e) => {
								setSource(e.target.value);
								setPage(1);
							}}
							className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition-all text-gray-700 shadow-sm appearance-none cursor-pointer pr-10"
						>
							<option value="">All Sources</option>
							<option value="Salary">Salary</option>
							<option value="Freelance">Freelance</option>
							<option value="Business">Business</option>
							<option value="Gift">Gift</option>
							<option value="Others">Others</option>
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
							<ChevronDown className="w-4 h-4" />
						</div>
					</div>
				</div>

				<div className="w-full flex-1 flex items-center gap-3">
					<div className="flex-1 flex flex-col gap-2">
						<span className="text-sm font-semibold text-gray-600">From Date</span>
						<input
							type="date"
							value={startDate}
							max={endDate || undefined}
							onChange={(e) => {
								setStartDate(e.target.value);
								setPage(1);
							}}
							className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition-all text-gray-700 shadow-sm"
						/>
					</div>
					<div className="flex-1 flex flex-col gap-2">
						<span className="text-sm font-semibold text-gray-600">To Date</span>
						<input
							type="date"
							value={endDate}
							min={startDate || undefined}
							onChange={(e) => {
								setEndDate(e.target.value);
								setPage(1);
							}}
							className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black transition-all text-gray-700 shadow-sm"
						/>
					</div>
				</div>

				<button
					className="px-6 py-2 flex gap-2 rounded-lg justify-center font-sm cursor-pointer text-lg items-center bg-black text-white border-white hover:bg-white hover:text-black hover:border-black border transition-colors duration-500 h-[42px]"
					onClick={openIncomeCreateModal}
				>
					<IoMdCreate /> Add
				</button>
			</div>

			{/* Incomes */}

			<div className="w-full flex flex-col gap-2">
				{loading ? (
					Array.from({ length: 3 }).map((_, i) => (
						<CardSkeleton key={i} variant="income-expense" />
					))
				) : incomes.length === 0 ? (
					<div className="w-full h-50 flex justify-center items-center rounded-lg p-5 shadow-lg">
						<p className="text-md text-black text-center">
							No income found
						</p>
					</div>
				) : (
					incomes.map((income) => (
						<div key={income._id} className="w-full rounded-lg border border-gray-100 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
								<div className="flex flex-col gap-2">
									<div>
										<p className="text-lg font-bold text-black">
											{income.title}
										</p>
										<p className="text-sm font-medium text-gray-400">
											{income.source}
										</p>
									</div>

									<p className="text-3xl font-bold text-emerald-600">
										{income.amount}{" "}
										{userData?.currency.toUpperCase()}
									</p>
								</div>

								<div className="flex flex-col justify-between items-end h-full gap-2 min-h-[90px]">
									<div className="flex gap-2">
										<button
											type="button"
											className="btn btn-sm bg-black text-white border-white hover:bg-white hover:text-black hover:border-black border transition-colors duration-500"
											onClick={() =>
												openIncomeEditModal(income)
											}
										>
											Edit
										</button>

										<button
											type="button"
											className="btn btn-sm bg-red-500 text-white border-red-500 hover:bg-white hover:text-red-500 transition-colors duration-500"
											onClick={() =>
												openDeleteIncomeModal(income._id)
											}
										>
											Delete
										</button>
									</div>
									<p className="text-xs font-medium text-gray-400">
										{new Date(income.createdAt).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short',
											year: 'numeric'
										})}
									</p>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Pagination */}

			{totalPages >= 1 && (
				<div className="mt-6 flex w-full justify-center">
					<Pagination
						count={totalPages}
						page={page}
						color="primary"
						onChange={(event, value) => setPage(value)}
					/>
				</div>
			)}

			{/* Add income Modal*/}

			<dialog
				ref={incomeCreateModalRef}
				className="modal modal-bottom sm:modal-middle inter"
			>
				<div className="modal-box max-w-xl p-6">
					<div className="flex items-center justify-between mb-4">
						<p className="text-xl font-bold">Add Income</p>

						<button
							type="button"
							className="btn btn-sm btn-circle btn-ghost"
							onClick={closeIncomeCreateModal}
						>
							✕
						</button>
					</div>

					<form
						onSubmit={handleSubmit(handleCreateIncome)}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-gray-700">
								Title
							</label>
							<input
								type="text"
								className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-black"
								placeholder="Monthly salary"
								{...register("title")}
							/>
							{errors.title && (
								<p className="text-sm text-red-600">
									{errors.title?.message}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-gray-700">
								Amount
							</label>
							<input
								type="number"
								className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-black"
								step="0.01"
								placeholder="5000"
								{...register("amount", { valueAsNumber: true })}
							/>
							{errors.amount && (
								<p className="text-sm text-red-600">
									{errors.amount?.message}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-gray-700">
								Source
							</label>
							<select
								className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-black"
								{...register("source")}
							>
								<option value="Salary">Salary</option>
								<option value="Freelance">Freelance</option>
								<option value="Business">Business</option>
								<option value="Gift">Gift</option>
								<option value="Others">Others</option>
							</select>
							{errors.source && (
								<p className="text-sm text-red-600">
									{errors.source?.message}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-gray-700">
								Note
							</label>
							<textarea
								className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-black resize-none"
								placeholder="Optional note"
								rows={3}
								{...register("note")}
							></textarea>
							{errors.note && (
								<p className="text-sm text-red-600">
									{errors.note?.message}
								</p>
							)}
						</div>

						<div className="flex justify-end gap-2">
							<button
								onClick={closeIncomeCreateModal}
								type="button"
								className="btn btn-soft"
							>
								Cancel
							</button>

							<button
								type="submit"
								className="w-28 btn bg-black text-white border-white hover:bg-white hover:text-black hover:border-black border transition-colors duration-500"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<span className="loading loading-dots loading-md"></span>
								) : (
									"Add"
								)}
							</button>
						</div>
					</form>
				</div>
			</dialog>

			{/* Delete Modal */}

			<dialog
				ref={deleteIncomeModalRef}
				className="modal modal-bottom sm:modal-middle inter"
			>
				<div className="modal-box max-w-md p-6">
					<div className="flex items-center justify-between mb-4">
						<p className="text-xl font-bold">Delete Income</p>

						<button
							type="button"
							className="btn btn-sm btn-circle btn-ghost"
							onClick={closeDeleteIncomeModal}
						>
							✕
						</button>
					</div>

					<div className="flex flex-col gap-6">
						<p className="text-sm text-gray-500">
							Are you sure you want to delete this income? This
							action cannot be undone.
						</p>

						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="btn btn-soft"
								onClick={closeDeleteIncomeModal}
							>
								Cancel
							</button>

							<button
								type="button"
								onClick={handleDeleteIncome}
								className="btn bg-red-500 text-white border-red-500 hover:bg-white hover:text-red-500 transition-colors duration-500"
								disabled={loading}
							>
								{loading ? (
									<span className="loading loading-dots loading-md"></span>
								) : (
									"Delete"
								)}
							</button>
						</div>
					</div>
				</div>
			</dialog>

			{/* Edit Modal */}

			<dialog
				ref={incomeEditModalRef}
				className="modal modal-bottom sm:modal-middle inter"
			>
				<div className="modal-box max-w-xl p-6">
					<div className="flex items-center justify-between mb-4">
						<p className="text-xl font-bold">Edit Income</p>

						<button
							type="button"
							className="btn btn-sm btn-circle btn-ghost"
							onClick={closeIncomeEditModal}
						>
							✕
						</button>
					</div>

					<form
						onSubmit={handleEditSubmit(handleUpdateIncome)}
						className="flex flex-col gap-4"
					>
						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-gray-700">
								Amount
							</label>

							<input
								type="number"
								step="0.01"
								className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-black"
								placeholder="5000"
								{...editRegister("amount", {
									valueAsNumber: true,
								})}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label className="text-sm font-semibold text-gray-700">
								Note
							</label>

							<textarea
								rows={3}
								className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-black resize-none"
								placeholder="Optional note"
								{...editRegister("note")}
							></textarea>
						</div>

						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="btn btn-soft"
								onClick={closeIncomeEditModal}
							>
								Cancel
							</button>

							<button
								type="submit"
								className="w-28 btn bg-black text-white border-white hover:bg-white hover:text-black hover:border-black border transition-colors duration-500"
								disabled={isEditSubmitting}
							>
								{isEditSubmitting ? (
									<span className="loading loading-dots loading-md"></span>
								) : (
									"Update"
								)}
							</button>
						</div>
					</form>
				</div>
			</dialog>
		</div>
	);
};

export default MyIncomes;