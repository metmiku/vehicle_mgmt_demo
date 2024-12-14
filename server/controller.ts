import { NextFunction, Request, Response, Router } from "express";
import Vehicle from "./Vehicle";
import { now } from "mongoose";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
	const vehicles = await Vehicle.find().select(["_id", "name", "status", "last_updated"]);
	res.json(vehicles);
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
	type VehicleCreate = {
		name: String;
		status: boolean;
	};
	const { name, status }: VehicleCreate = req.body;
	let errorResponse: {
		name?: string;
		status?: string;
	} = {};
	if (!name) {
		errorResponse.name = "Name not provided";
	} else {
		const nameAlreadyInUse = await Vehicle.findOne({ name });
		if (nameAlreadyInUse) {
			errorResponse.name = "This vehicle is already registered";
		}
	}
	if (!status) {
		errorResponse.status = "Status not provided";
	}

	if (errorResponse.name || errorResponse.status) {
		res.status(400).json({ error: errorResponse });
		return;
	}

	const newVehicle = new Vehicle({
		name,
		status,
	});

	try {
		const vehicle = await newVehicle.save();

		res.status(201).json(vehicle);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error." });
	}
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params;

	type VehicleUpdate = {
		name?: string;
		status?: boolean;
	};
	const { name, status }: VehicleUpdate = req.body;

	try {
		const vehicle = await Vehicle.findById(id);

		if (!vehicle) {
			res.status(404).json({ message: "Vehicle not found" });
			return;
		}

		let updated = false;
		if (name && vehicle.name != name) {
			const nameAlreadyInUse = await Vehicle.findOne({ name });
			if (nameAlreadyInUse) {
				res.status(400).json({ error: { name: "This vehicle is already registered" } });
				return;
			}
			vehicle.name = name;
			updated = true;
		}
		if (status != undefined && vehicle.status != status) {
			vehicle.status = status;
			updated = true;
		}

		console.log({
			status,
			vehicleStatus: vehicle.status,
			condition: status && vehicle.status != status,
		});

		if (updated) {
			vehicle.last_updated = now();
			const { _id, name, status, last_updated } = await vehicle.save();
			res.status(200).json({ _id, name, status, last_updated });
			return;
		}
		res.status(204).json();
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error." });
	}
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params;
	try {
		const vehicle = await Vehicle.findById(id);
		if (!vehicle) {
			res.status(404).json({ message: "Vehicle not found" });
			return;
		}

		await Vehicle.findByIdAndDelete(id);
		res.status(200).json({ _id: vehicle._id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error." });
	}
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
	const { id } = req.params;
	try {
		const vehicle = await Vehicle.findById(id).select([
			"_id",
			"name",
			"status",
			"last_updated",
		]);
		if (!vehicle) {
			res.status(404).json({ message: `Vehicle with id ${id} not found.` });
			return;
		}
		res.json(vehicle);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error." });
	}
});

// Helper for mass populating the db
router.post("/bulk", async (req: Request, res: Response, next: NextFunction) => {
	type VehicleCreate = {
		name: String;
		status: boolean;
	};
	const vehicles: VehicleCreate[] = req.body;

	let response: { id: string; name: string }[] = [];
	for (let i = 0; i < vehicles.length; i++) {
		const { name, status } = vehicles[i];
		if (!name || !status) {
			continue;
		}

		const newVehicle = new Vehicle({
			name,
			status,
		});

		try {
			const vehicleSave = await newVehicle.save();
			response.push({ id: vehicleSave.id, name: vehicleSave.name });
		} catch (error) {
			console.error(error);
		}
	}
	res.status(201).json(response);
});

export default router;
