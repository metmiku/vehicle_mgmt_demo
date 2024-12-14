import mongoose, { Document, now, Schema } from "mongoose";

export interface IVehicle extends Document {
	name: string;
	status: boolean;
	last_updated: Date;
}

const VehicleSchema: Schema = new Schema({
	name: { type: String, required: true, unique: true },
	status: { type: Boolean, required: true },
	last_updated: { type: Date, required: true, default: now() },
});

const Vehicle = mongoose.model<IVehicle>("Vehicle", VehicleSchema);
export default Vehicle;
