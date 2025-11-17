import React, { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface ProjectDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	initialValues?: {
		name: string
		description: string
		status: string
		clientdetails: {
			clientname: string
			clientnumber: number
			clientaddress: string
		}
	}
	onSubmit: (project: {
		name: string
		description: string
		status: string
		clientdetails: {
			clientname: string
			clientnumber: number
			clientaddress: string
		}
	}) => Promise<void> | void
}

export function ProjectDialog({ open, onOpenChange, onSubmit, initialValues }: ProjectDialogProps) {
	const [name, setName] = useState(initialValues?.name ?? "")
	const [description, setDescription] = useState(initialValues?.description ?? "")
	const [status, setStatus] = useState(initialValues?.status ?? "Active")
	const [clientName, setClientName] = useState(initialValues?.clientdetails.clientname ?? "")
	const [clientNumber, setClientNumber] = useState(
		initialValues ? String(initialValues.clientdetails.clientnumber) : "",
	)
	const [clientAddress, setClientAddress] = useState(initialValues?.clientdetails.clientaddress ?? "")
	const [loading, setLoading] = useState(false)

	React.useEffect(() => {
		setName(initialValues?.name ?? "")
		setDescription(initialValues?.description ?? "")
		setStatus(initialValues?.status ?? "Active")
		setClientName(initialValues?.clientdetails.clientname ?? "")
		setClientNumber(initialValues ? String(initialValues.clientdetails.clientnumber) : "")
		setClientAddress(initialValues?.clientdetails.clientaddress ?? "")
	}, [initialValues, open])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			await onSubmit({
				name,
				description,
				status,
				clientdetails: {
					clientname: clientName,
					clientnumber: Number(clientNumber),
					clientaddress: clientAddress,
				},
			})
			onOpenChange(false)
			setName("")
			setDescription("")
			setStatus("Active")
			setClientName("")
			setClientNumber("")
			setClientAddress("")
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-slate-200/80 bg-white px-5 py-4 text-slate-900 shadow-xl shadow-slate-900/20 focus:outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-50">
				<DialogHeader>
					<DialogTitle className="text-base">Add Project</DialogTitle>
					<DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
						Create a new project with basic details and client information.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
					<div className="space-y-1.5">
						<label className="block text-[11px] font-medium">Name</label>
						<input
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
							placeholder="Smart Traffic Monitoring"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="block text-[11px] font-medium">Description</label>
						<textarea
							required
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
							placeholder="A system to monitor real-time traffic conditions"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="block text-[11px] font-medium">Status</label>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-slate-500"
						>
							<option value="Active">Active</option>
							<option value="On Hold">On Hold</option>
							<option value="Completed">Completed</option>
						</select>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
						<div className="space-y-1.5">
							<label className="block text-[11px] font-medium">Client name</label>
							<input
								required
								value={clientName}
								onChange={(e) => setClientName(e.target.value)}
								className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
								placeholder="City Corporation"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="block text-[11px] font-medium">Client number</label>
							<input
								required
								type="tel"
								value={clientNumber}
								onChange={(e) => setClientNumber(e.target.value)}
								className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
								placeholder="9876543210"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="block text-[11px] font-medium">Client address</label>
						<input
							required
							value={clientAddress}
							onChange={(e) => setClientAddress(e.target.value)}
							className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
							placeholder="Main Street, Bangalore"
						/>
					</div>

					<DialogFooter className="mt-4 flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-xs"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" size="sm" className="text-xs" disabled={loading}>
							{loading ? "Saving..." : "Save project"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

